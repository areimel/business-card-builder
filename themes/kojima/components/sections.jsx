import { cx, make } from '../../../server/components/core.jsx';
import { DateRange } from './layout.jsx';
import { Label, CellHeading, CellSubHeading } from './text.jsx';

const BoxBase = make('box');
// title="Profile" -> CellHeading first (colon added automatically).
export const Box = ({ title, children, ...rest }) => (
  <BoxBase {...rest}>
    {title && <CellHeading>{title}</CellHeading>}
    {children}
  </BoxBase>
);

// Factory for a titled Box with an extra semantic class.
const section = (cls, defaultTitle) => ({ title = defaultTitle, className, ...rest }) => (
  <Box title={title} className={cx(cls, className)} {...rest} />
);

export const ProfileSection = section('profile-section', 'Profile');
export const PreviousClientSection = section('client-section', 'Previous Clients');
export const SidebarList = section('sidebar-list');

// Sub-titled list of roles/items inside a cell.
export const JobRoleListSection = ({ title, className, children }) => (
  <div className={cx('job-role-list', className)}>
    {title && <CellSubHeading>{title}</CellSubHeading>}
    {children}
  </div>
);

// Box holding a single heading-style note (no colon).
const PageNoteBox = make('box page-note');
export const PageNote = ({ children, ...rest }) => (
  <PageNoteBox {...rest}>
    <CellHeading colon={false}>{children}</CellHeading>
  </PageNoteBox>
);

// "Title  company — dates" line followed by details.
export const ExperienceItem = ({ title, company, dates, className, children }) => (
  <div className={cx('experience-item', className)}>
    <p>
      <Label>{title}</Label> {company}
      {dates && <> — <DateRange>{dates}</DateRange></>}
    </p>
    {children}
  </div>
);
