import { cx, make } from '../../../server/components/core.jsx';
import { Box } from './sections.jsx';
import { Kicker } from './Kicker.jsx';
import { Label } from './text.jsx';

// Outcome case study: numbered kicker, title, children (stats + story parts), optional stack line.
export const CaseStudy = ({ index, kicker, title, stack, className, children, ...rest }) => (
  <Box className={cx('case-study', className)} {...rest}>
    <Kicker index={index}>{kicker}</Kicker>
    {title && <h2 className="case-title">{title}</h2>}
    {children}
    {stack && <p className="case-stack"><Label>Stack</Label> {stack}</p>}
  </Box>
);

// Strip of headline metrics.
export const StatRow = make('stat-row');
export const Stat = ({ value, label }) => (
  <div className="stat">
    <span className="stat-value">{value}</span>
    <span className="stat-label">{label}</span>
  </div>
);

// Labeled story row: "CHALLENGE | body".
const part = (label) => ({ children }) => (
  <div className={cx('story-part', `story-${label.toLowerCase()}`)}>
    <p className="story-label">{label}</p>
    <div className="story-body">{children}</div>
  </div>
);

export const Challenge = part('Challenge');
export const Action = part('Action');
export const Result = part('Result');
