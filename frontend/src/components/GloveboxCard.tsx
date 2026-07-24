import { DUMMY_VEHICLE_PROFILES, daysUntil } from '../data/dummyVehicleProfiles'

const FEATURED_PROFILE = DUMMY_VEHICLE_PROFILES[0]
const EXPIRY_WARNING_DAYS = 30

export function GloveboxCard() {
  return (
    <div className="panel glovebox-card">
      <h2>Guantera Digital</h2>
      <p className="muted glovebox-subtitle">
        {FEATURED_PROFILE.model} • {FEATURED_PROFILE.plate} (datos de ejemplo)
      </p>
      <ul className="glovebox-list">
        {FEATURED_PROFILE.documents.map((doc) => {
          const remaining = daysUntil(doc.expiresAt)
          const expiringSoon = remaining <= EXPIRY_WARNING_DAYS
          return (
            <li key={doc.name} className="list-card">
              <div className="icon-box bg-cyan">📄</div>
              <div className="card-info">
                <h5>{doc.name}</h5>
                <p>
                  {expiringSoon ? `Vence en ${remaining} días` : `Vigente hasta ${doc.expiresAt}`} •{' '}
                  {doc.issuer}
                </p>
              </div>
              {expiringSoon && <span className="tag-warning">Renovar</span>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
