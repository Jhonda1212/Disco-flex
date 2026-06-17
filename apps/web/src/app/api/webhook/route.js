import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function confirmarReservaPagada(session, id) {
  if (!session.payment_intent) {
    throw new Error(`La sesion ${session.id} no contiene payment_intent`)
  }

  const { data: reservaActual, error: reservaError } = await supabase
    .from('reservas')
    .select('id, estado, estado_pago, qr_token, stripe_payment')
    .eq('id', id)
    .maybeSingle()

  console.log('[WEBHOOK] Reserva antes de actualizar:', {
    id,
    data: reservaActual,
    error: reservaError,
  })

  if (reservaError) {
    throw new Error(`Error consultando reserva: ${reservaError.message}`)
  }

  if (!reservaActual) {
    throw new Error(`No existe reserva con id ${id}`)
  }

  if (reservaActual.estado_pago === 'pagado') {
    console.log('[WEBHOOK] Reserva ya pagada; evento idempotente:', {
      id,
      qrTokenPresente: Boolean(reservaActual.qr_token),
      stripePaymentPresente: Boolean(reservaActual.stripe_payment),
    })
    return reservaActual
  }

  if (reservaActual.estado_pago !== 'pendiente') {
    throw new Error(
      `La reserva ${id} no esta pendiente de pago: ${reservaActual.estado_pago}`
    )
  }

  const { data, error, count } = await supabase
    .from('reservas')
    .update({
      estado_pago: 'pagado',
      stripe_payment: session.payment_intent,
      qr_token: reservaActual.qr_token ?? randomUUID(),
    }, { count: 'exact' })
    .eq('id', id)
    .eq('estado_pago', 'pendiente')
    .select('id, estado, estado_pago, qr_token, stripe_payment')

  console.log('[WEBHOOK] Resultado reserva:', {
    id,
    data,
    error,
    count,
  })

  if (error) {
    throw new Error(`Error actualizando reserva: ${error.message}`)
  }

  if (data?.length) {
    return data[0]
  }

  const { data: reservaDespues, error: despuesError } = await supabase
    .from('reservas')
    .select('id, estado, estado_pago, qr_token, stripe_payment')
    .eq('id', id)
    .maybeSingle()

  console.log('[WEBHOOK] Reserva tras update sin filas:', {
    id,
    data: reservaDespues,
    error: despuesError,
  })

  if (
    !despuesError &&
    reservaDespues?.estado_pago === 'pagado' &&
    reservaDespues.qr_token &&
    reservaDespues.stripe_payment
  ) {
    return reservaDespues
  }

  throw new Error(`No se pudo marcar como pagada la reserva ${id}`)
}

async function confirmarPedidoPagado(session, id) {
  if (!session.payment_intent) {
    throw new Error(`La sesion ${session.id} no contiene payment_intent`)
  }

  const { data: pedidoActual, error: pedidoError } = await supabase
    .from('pedidos')
    .select('id, estado_pago, stripe_payment')
    .eq('id', id)
    .maybeSingle()

  console.log('[WEBHOOK] Pedido antes de actualizar:', {
    id,
    data: pedidoActual,
    error: pedidoError,
  })

  if (pedidoError) {
    throw new Error(`Error consultando pedido: ${pedidoError.message}`)
  }

  if (!pedidoActual) {
    throw new Error(`No existe pedido con id ${id}`)
  }

  if (pedidoActual.estado_pago === 'pagado') {
    console.log('[WEBHOOK] Pedido ya pagado; evento idempotente:', {
      id,
      stripePaymentPresente: Boolean(pedidoActual.stripe_payment),
    })
    return pedidoActual
  }

  if (pedidoActual.estado_pago !== 'pendiente') {
    throw new Error(
      `El pedido ${id} no esta pendiente de pago: ${pedidoActual.estado_pago}`
    )
  }

  const { data, error, count } = await supabase
    .from('pedidos')
    .update({
      estado_pago: 'pagado',
      stripe_payment: session.payment_intent,
    }, { count: 'exact' })
    .eq('id', id)
    .eq('estado_pago', 'pendiente')
    .select('id, estado_pago, stripe_payment')

  console.log('[WEBHOOK] Resultado pedido:', {
    id,
    data,
    error,
    count,
  })

  if (error) {
    throw new Error(`Error actualizando pedido: ${error.message}`)
  }

  if (!data?.length) {
    throw new Error(`No se pudo marcar como pagado el pedido ${id}`)
  }

  return data[0]
}

async function confirmarPago(session) {
  const tipo = session.metadata?.tipo
  const id = session.metadata?.id

  console.log('[WEBHOOK] Metadata:', {
    tipo,
    id,
    paymentStatus: session.payment_status,
    paymentIntent: session.payment_intent,
  })

  if (!tipo || !id) {
    throw new Error('El evento no contiene metadata tipo/id')
  }

  if (tipo === 'reserva') {
    return confirmarReservaPagada(session, id)
  }

  if (tipo === 'pedido') {
    return confirmarPedidoPagado(session, id)
  }

  throw new Error(`Tipo de checkout no soportado: ${tipo}`)
}

export async function POST(req) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  let evento

  try {
    evento = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (error) {
    console.error('[WEBHOOK] Firma invalida:', error.message)

    return NextResponse.json(
      { error: 'Firma invalida' },
      { status: 400 }
    )
  }

  console.log('[WEBHOOK] Evento recibido:', evento.type)

  try {
    if (
      evento.type === 'checkout.session.completed' ||
      evento.type === 'checkout.session.async_payment_succeeded'
    ) {
      const session = evento.data.object

      if (
        session.payment_status === 'paid' ||
        evento.type === 'checkout.session.async_payment_succeeded'
      ) {
        await confirmarPago(session)
      } else {
        console.log(
          '[WEBHOOK] Checkout completado, pero pago todavia no confirmado:',
          session.payment_status
        )
      }
    }

    if (evento.type === 'checkout.session.expired') {
      const session = evento.data.object
      const tipo = session.metadata?.tipo
      const id = session.metadata?.id
      const tabla = tipo === 'reserva' ? 'reservas' : 'pedidos'

      const { data, error, count } = await supabase
        .from(tabla)
        .update({ estado_pago: 'cancelado' }, { count: 'exact' })
        .eq('id', id)
        .eq('estado_pago', 'pendiente')
        .select('id, estado_pago')

      console.log('[WEBHOOK] Checkout expirado:', {
        tipo,
        id,
        data,
        error,
        count,
      })

      if (error) {
        throw new Error(error.message)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[WEBHOOK] ERROR REAL:', error)
    console.error('[WEBHOOK] Mensaje:', error.message)
    console.error('[WEBHOOK] Stack:', error.stack)

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
