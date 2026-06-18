// Gabarits des emails de rappel (besoin point 6). HTML simple, fond clair.

export interface TacheEmail {
  titre: string;
  projetNom: string;
  priorite: string;
  joursRetard: number; // 0 si pas en retard
}

const PRIO_EMOJI: Record<string, string> = { haute: '🔴', moyenne: '🟠', basse: '🔵', aucune: '' };

interface Email {
  sujet: string;
  html: string;
  text: string;
}

function bouton(url: string, label: string): string {
  return `<a href="${url}" style="display:inline-block;background:#4a9eff;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:500;">${label}</a>`;
}

function cadre(contenu: string): string {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a;line-height:1.5;">${contenu}</div>`;
}

function ligneTache(t: TacheEmail): string {
  const retard = t.joursRetard > 0 ? ` <span style="color:#c0392b;">· +${t.joursRetard}j</span>` : '';
  const prio = PRIO_EMOJI[t.priorite] ? `${PRIO_EMOJI[t.priorite]} ` : '';
  return `<li style="margin:4px 0;">${prio}${t.titre}${retard}</li>`;
}

function grouperParProjet(taches: TacheEmail[]): Map<string, TacheEmail[]> {
  const m = new Map<string, TacheEmail[]>();
  for (const t of taches) {
    const k = t.projetNom || 'Sans projet';
    m.set(k, [...(m.get(k) ?? []), t]);
  }
  return m;
}

// 8h — briefing matin : tâches du jour groupées par projet
export function emailBriefing(prenom: string, url: string, taches: TacheEmail[]): Email {
  const sujet = `☀️ Ton briefing du jour — ${taches.length} tâche${taches.length > 1 ? 's' : ''}`;

  if (taches.length === 0) {
    const corps = `<p>Bonjour ${prenom},</p><p>Rien de prévu aujourd'hui 🎉 Profites-en pour avancer sur ton backlog.</p><p>${bouton(url, 'Ouvrir l’app')}</p>`;
    return { sujet: '☀️ Ton briefing du jour', html: cadre(corps), text: `Bonjour ${prenom}, rien de prévu aujourd'hui. ${url}` };
  }

  const groupes = grouperParProjet(taches);
  let sections = '';
  const lignesTexte: string[] = [];
  for (const [projet, liste] of groupes) {
    sections += `<h3 style="margin:16px 0 4px;font-size:15px;">${projet}</h3><ul style="margin:0;padding-left:20px;">${liste.map(ligneTache).join('')}</ul>`;
    lignesTexte.push(`${projet}:`, ...liste.map(t => `  - ${t.titre}${t.joursRetard > 0 ? ` (+${t.joursRetard}j)` : ''}`));
  }

  const corps = `<p>Bonjour ${prenom},</p><p>Voici tes tâches pour aujourd'hui :</p>${sections}<p style="margin-top:20px;">${bouton(url, 'Ouvrir le backlog')}</p>`;
  return {
    sujet,
    html: cadre(corps),
    text: `Bonjour ${prenom}, tes tâches du jour :\n${lignesTexte.join('\n')}\n\n${url}`,
  };
}

// 18h — relance retards : liste des tâches en retard
export function emailRelance(prenom: string, url: string, retards: TacheEmail[]): Email {
  if (retards.length === 0) {
    const corps = `<p>Bonjour ${prenom},</p><p>Aucune tâche en retard ce soir 👏 Bonne soirée !</p>`;
    return { sujet: '✅ Aucun retard ce soir', html: cadre(corps), text: `Bonjour ${prenom}, aucune tâche en retard ce soir.` };
  }

  const sujet = `🔴 ${retards.length} tâche${retards.length > 1 ? 's' : ''} en retard`;
  const liste = `<ul style="margin:0;padding-left:20px;">${retards.map(ligneTache).join('')}</ul>`;
  const corps = `<p>Bonjour ${prenom},</p><p>En fin de journée, il te reste ${retards.length} tâche${retards.length > 1 ? 's' : ''} en retard :</p>${liste}<p style="margin-top:20px;">${bouton(url, 'Traiter les retards')}</p>`;
  return {
    sujet,
    html: cadre(corps),
    text: `Bonjour ${prenom}, ${retards.length} tâche(s) en retard :\n${retards.map(t => `  - ${t.titre} (+${t.joursRetard}j)`).join('\n')}\n\n${url}`,
  };
}
