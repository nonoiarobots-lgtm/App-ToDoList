'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { estEnRetard, joursDeRetard } from '@/lib/logique-taches';
import type { Tache } from '@/types/tache';

const COULEUR_PRIORITE: Record<string, string> = {
  haute: 'var(--p1)',
  moyenne: 'var(--p2)',
  basse: 'var(--p3)',
  aucune: 'var(--p4)',
};

function labelEcheance(tache: Tache): { texte: string; late: boolean } | null {
  if (!tache.date_echeance) return null;
  const echeance = new Date(tache.date_echeance);
  const aujourdHui = new Date();
  const demain = new Date(aujourdHui);
  demain.setDate(demain.getDate() + 1);

  if (estEnRetard(tache)) {
    const jours = joursDeRetard(tache.date_echeance);
    return { texte: jours > 0 ? `+${jours}j de retard` : 'en retard', late: true };
  }
  if (echeance.toDateString() === aujourdHui.toDateString()) return { texte: "aujourd'hui", late: false };
  if (echeance.toDateString() === demain.toDateString()) return { texte: 'demain', late: false };
  return {
    texte: echeance.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
    late: false,
  };
}

export function TacheCard({ tache, onCloturer }: { tache: Tache; onCloturer: (t: Tache) => void }) {
  const retard = estEnRetard(tache);
  const aujourdHui =
    tache.date_echeance && new Date(tache.date_echeance).toDateString() === new Date().toDateString();
  const echeance = labelEcheance(tache);

  return (
    <div className={`task-item ${retard ? 'overdue' : aujourdHui ? 'today' : ''}`}>
      <button
        className="task-check"
        aria-label="Clôturer la tâche"
        onClick={e => {
          e.preventDefault();
          onCloturer(tache);
        }}
      >
        <Icon name="check" />
      </button>
      <Link href={`/tache/${tache.id}`} className="task-body" style={{ color: 'inherit' }}>
        <div className="task-title">{tache.titre}</div>
        <div className="task-meta">
          {tache.statut === 'a_qualifier' && (
            <span className="tag tag-qualifier">
              <Icon name="auto_awesome" /> à qualifier
            </span>
          )}
          {tache.projet && (
            <span
              className="tag"
              style={{
                background: tache.projet.couleur ? `${tache.projet.couleur}20` : 'rgba(255,255,255,0.06)',
                color: tache.projet.couleur ?? 'var(--text-dim)',
              }}
            >
              {tache.projet.icone ? `${tache.projet.icone} ` : ''}
              {tache.projet.nom}
            </span>
          )}
          {echeance && <span className={`tag tag-date ${echeance.late ? 'late' : ''}`}>{echeance.texte}</span>}
          {tache.statut === 'en_attente_retour' && (
            <span className="tag tag-qualifier">
              <Icon name="schedule" /> {tache.responsable}
            </span>
          )}
        </div>
      </Link>
      <span className="priority-dot" style={{ background: COULEUR_PRIORITE[tache.priorite] }} />
    </div>
  );
}
