import { make } from '../../../server/components/core.jsx';

export const Header = make('page-header');
export const Contact = make('contact-line meta');
// One line of <ContactField>s inside <Contact> (a JSX-only line isn't wrapped in <p> by MDX).
export const ContactRow = make('contact-row', 'p');
// Metadata lines (location, dates, roles…): body font at --meta-size, the theme owns .meta.
export const Meta = make('meta');
export const SidebarLayout = make('sidebar-layout');
export const Sidebar = make('sidebar');
export const Main = make('main');
export const Columns = make('columns');
export const SkillGrid = make('skill-grid');
export const Muted = make('muted', 'span');
export const DateRange = make('date-range', 'span');

// Standalone de-emphasized paragraph: <p><span class="muted">…</span></p>.
export const Note = ({ children }) => (
  <p>
    <Muted>{children}</Muted>
  </p>
);
