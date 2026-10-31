import {
  Header, Contact, ContactRow, Meta, SidebarLayout, Sidebar, Main, Columns, SkillGrid, Muted, Note, DateRange,
} from './layout.jsx';
import { Label, CellHeading, CellSubHeading, NameHeading, ContactField } from './text.jsx';
import {
  Box, ProfileSection, PreviousClientSection, SidebarList, JobRoleListSection, PageNote, ExperienceItem,
} from './sections.jsx';
import { Role, JobRoleHeading } from './Role.jsx';

// Terminal's own components; core (Page, PageBreak, QR) is injected by the server.
export const components = {
  Header, Contact, Meta, SidebarLayout, Sidebar, Main, Box, Columns, SkillGrid, Muted, Note, DateRange, Role,
  ContactRow, Label, CellHeading, CellSubHeading, NameHeading, ContactField,
  ProfileSection, PreviousClientSection, SidebarList, JobRoleListSection, PageNote, ExperienceItem, JobRoleHeading,
};
