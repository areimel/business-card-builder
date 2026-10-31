import { cx } from '../../../server/components/core.jsx';
import { Note, Meta } from './layout.jsx';
import { Label } from './text.jsx';

// "Label:" paragraph, e.g. <p><strong>Duration:</strong> Nov. 2020 - Oct. 2022</p>
const Field = ({ name, children }) => (
  <p>
    <Label>{name}</Label> {children}
  </p>
);

// Heading line + meta block for a job role. Usable standalone (no box wrapper).
// label="" drops the "Label: " prefix (for themes that show the label elsewhere).
export const JobRoleHeading = ({
  label = 'Role', title, company, dates, location, subRoles, clientTypes,
}) => {
  const heading = [title, company].filter(Boolean).join(' - ');
  return (
    <>
      <p className="job-role-heading">
        <strong>{heading && label ? `${label}: ${heading}` : heading || label}</strong>
      </p>
      {(dates || location || subRoles || clientTypes) && (
        <Meta>
          {(dates || location) && (
            <p>
              {dates && <><Label>Duration</Label> {dates}</>}
              {dates && location && ' // '}
              {location && <><Label>Location</Label> {location}</>}
            </p>
          )}
          {subRoles && <Field name="Sub-Roles">{subRoles}</Field>}
          {clientTypes && <Field name="Client Types">{clientTypes}</Field>}
        </Meta>
      )}
    </>
  );
};

export const Role = ({ note, pageBreak, fill, className, children, ...heading }) => (
  <div className={cx('box', 'role', className, pageBreak && 'page-break', fill && 'fill')}>
    {note && <Note>{note}</Note>}
    <JobRoleHeading {...heading} />
    {children}
  </div>
);
