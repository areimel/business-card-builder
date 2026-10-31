import { cx } from '../../../server/components/core.jsx';
import { Box } from './sections.jsx';
import { Kicker } from './Kicker.jsx';

// Box with a numbered kicker heading instead of a "Title:" cell heading.
export const Section = ({ index, title, className, children, ...rest }) => (
  <Box className={cx('section', className)} {...rest}>
    <Kicker index={index}>{title}</Kicker>
    {children}
  </Box>
);
