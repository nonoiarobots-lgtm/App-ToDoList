// Envoi de notifications Web Push (VAPID) — implémentation en tranche ④

export async function envoyerPush(
  _subscription: PushSubscriptionJSON,
  _payload: { title: string; body: string; url: string }
): Promise<void> {
  // TODO tranche ④ : librairie web-push, clés VAPID, fallback email si échec
  throw new Error('NOT_IMPLEMENTED');
}
