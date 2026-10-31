import { cx } from '../../../server/components/core.jsx';
import { Note } from './layout.jsx';
import { JobRoleHeading } from './Role.jsx';
import { Kicker } from './Kicker.jsx';

// Role with a numbered kicker ("05 / Latest Role") above the heading + meta; the kicker carries the label.
export const Signal = ({ index, note, pageBreak, fill, className, children, ...heading }) => (
  <div className={cx('box', 'role', 'signal', className, pageBreak && 'page-break', fill && 'fill')}>
    <Kicker index={index} className="signal-kicker">{heading.label || 'Role'}</Kicker>
    {note && <Note>{note}</Note>}
    <JobRoleHeading {...heading} label="" />
    {children}
  </div>
);
