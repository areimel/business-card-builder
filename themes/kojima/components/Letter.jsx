import { make, cx } from '../../../server/components/core.jsx';
import { Box } from './sections.jsx';
import { Kicker } from './Kicker.jsx';

// Cover-letter page body: a Box (div.box.letter) holding the parts below.
export const Letter = ({ className, children, ...rest }) => (
  <Box className={cx('letter', className)} {...rest}>
    {children}
  </Box>
);

// Date line under the letterhead.
export const Dateline = make('letter-date', 'p');

// Addressee block: name, optional title/company, then address lines (Markdown).
export const Recipient = ({ name, title, company, children }) => (
  <div className="letter-recipient meta">
    <p className="recipient-name">{name}</p>
    {title && <p>{title}</p>}
    {company && <p>{company}</p>}
    {children}
  </div>
);

export const Salutation = make('salutation', 'p');

// Body section, optionally headed by a numbered kicker ("01 / WHY BEMARKETING").
export const LetterPart = ({ index, label, children }) => (
  <div className="letter-part">
    {label && (
      <Kicker index={index} className="letter-part-kicker">
        {label}
      </Kicker>
    )}
    <div className="letter-part-body">{children}</div>
  </div>
);

// Closing, name and optional title.
export const SignOff = ({ closing = 'Sincerely,', name, title }) => (
  <div className="sign-off">
    <p className="sign-off-closing">{closing}</p>
    <p className="sign-off-name">{name}</p>
    {title && <p className="sign-off-title">{title}</p>}
  </div>
);

// Wrapper for <Stat> elements stacked vertically.
export const StatStack = make('stat-stack');
