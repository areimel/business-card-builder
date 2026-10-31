// Editorial caption strip ("KOJIMA / SIGNAL RESEARCH BUREAU ... PLATE 025") and inline figure caption.
export const Plate = ({ code = 'Plate 001', org = 'Signal / Résumé' }) => (
  <div className="plate-strip">
    <span className="plate-org">{org}</span>
    <span className="plate-code">{code}</span>
  </div>
);

export const Fig = ({ n, children }) => (
  <span className="fig">FIG. {n}{children && <> / {children}</>}</span>
);
