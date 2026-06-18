import { pdf, Document, Page, Text, View, StyleSheet, Font, Link } from '@react-pdf/renderer';
import type { ReactNode } from 'react';

const normalizeUrl = (value: string) => {
  const trimmed = value.trim();
  if (/^(mailto:|https?:\/\/)/i.test(trimmed)) {
    return trimmed;
  }
  if (/^www\./i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return `https://${trimmed}`;
};

const renderContactLine = (contactText: string) => {
  const segments = contactText
    .split(/\s*\|\s*/)
    .map((part) => part.trim())
    .filter((part) => part !== '');

  if (segments.length === 0) {
    return <Text style={styles.contactInfo}>Phone | Email | LinkedIn</Text>;
  }

  return (
    <View style={styles.contactRow}>
      {segments.map((segment, index) => {
        const isEmail = /@/.test(segment) && !/^https?:\/\//i.test(segment);
        const isUrl = /^(https?:\/\/|www\.|linkedin\.com|github\.com)/i.test(segment);
        const element: ReactNode = isEmail ? (
          <Link src={`mailto:${segment}`} style={styles.link}>
            {segment}
          </Link>
        ) : isUrl ? (
          <Link src={normalizeUrl(segment)} style={styles.link}>
            {segment}
          </Link>
        ) : (
          <Text style={styles.contactInfo}>{segment}</Text>
        );

        return (
          <View key={index} style={styles.contactItem}>
            {element}
            {index < segments.length - 1 && (
              <Text style={styles.separator}> • </Text>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    padding: '0.75in',
    fontFamily: 'Times-Roman',
    fontSize: 10.5,
    lineHeight: 1.15,
  },
  contact: {
    textAlign: 'center',
    marginBottom: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  contactInfo: {
    fontSize: 10.5,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  separator: {
    fontSize: 10.5,
    color: '#000000',
  },
  link: {
    color: '#000000',
    textDecoration: 'underline',
    fontSize: 10.5,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 3,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  sectionContent: {
    fontSize: 10.5,
  },
});

export interface ResumeSection {
  id: string;
  title: string;
  content: string;
}

export const generateATSResume = async (sections: ResumeSection[], name: string) => {
  const contactSection = sections.find((s) => s.id === 'contact');
  const otherSections = sections.filter((s) => s.id !== 'contact');
  const contactText = contactSection ? contactSection.content.replace(/\n/g, ' | ') : 'Phone | Email | LinkedIn';

  const MyDocument = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.contact}>
          <Text style={styles.name}>{name || 'YOUR NAME'}</Text>
          {renderContactLine(contactText)}
        </View>

        {otherSections.map((sec) => {
          if (!sec.content.trim()) return null;
          return (
            <View key={sec.id} style={styles.section} wrap={false}>
              <Text style={styles.sectionTitle}>{sec.title}</Text>
              <Text style={styles.sectionContent}>{sec.content}</Text>
            </View>
          );
        })}
      </Page>
    </Document>
  );

  const asPdf = pdf();
  asPdf.updateContainer(MyDocument);
  const blob = await asPdf.toBlob();

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  const fileName = name ? `${name.toLowerCase().replace(/\s+/g, '_')}_resume.pdf` : 'resume.pdf';
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

// --- Auto-Fix PDF Generator ------------------------------------

export interface AutoFixResult {
  name: string;
  contact: {
    email?: string;
    phone?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
    location?: string;
  };
  summary?: string;
  experience?: Array<{
    title: string;
    company: string;
    duration: string;
    bullets: string[];
  }>;
  education?: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  skills?: string[];
  projects?: Array<{
    name: string;
    tech?: string;
    description?: string;
    achievements?: string[];
    github_url?: string;
  }>;
}

const autoFixStyles = StyleSheet.create({
  page: {
    padding: '0.75in',
    fontFamily: 'Times-Roman',
    fontSize: 10,
    lineHeight: 1.15,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  separator: {
    fontSize: 9.5,
    color: '#000000',
  },
  link: {
    color: '#000000',
    textDecoration: 'underline',
    fontSize: 9.5,
  },
  nameBlock: {
    textAlign: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  contactLine: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  section: {
    marginBottom: 7,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 3,
    paddingBottom: 2,
    borderBottomWidth: 0.75,
    borderBottomColor: '#000',
  },
  entryHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 1,
  },
  entrySubheader: {
    fontSize: 10,
    color: '#444',
    marginBottom: 2,
  },
  bullet: {
    fontSize: 9,
    paddingLeft: 14,
    marginBottom: 1.5,
  },
  bodyText: {
    fontSize: 10,
    lineHeight: 1.15,
  },
  skillsText: {
    fontSize: 10,
    lineHeight: 1.3,
  },
});

const ContactLinkRow = ({ contact }: { contact: AutoFixResult['contact'] }) => {
  const parts: ReactNode[] = [];

  if (contact.email) {
    parts.push(
      <Link key="email" src={`mailto:${contact.email}`} style={autoFixStyles.link}>
        {contact.email}
      </Link>
    );
  }

  if (contact.phone) {
    parts.push(
      <Text key="phone" style={autoFixStyles.contactItem}>
        {contact.phone}
      </Text>
    );
  }

  if (contact.linkedin) {
    parts.push(
      <Link key="linkedin" src={normalizeUrl(contact.linkedin)} style={autoFixStyles.link}>
        LinkedIn
      </Link>
    );
  }

  if (contact.github) {
    parts.push(
      <Link key="github" src={normalizeUrl(contact.github)} style={autoFixStyles.link}>
        GitHub
      </Link>
    );
  }

  if (contact.portfolio) {
    parts.push(
      <Link key="portfolio" src={normalizeUrl(contact.portfolio)} style={autoFixStyles.link}>
        Portfolio
      </Link>
    );
  }

  if (contact.location) {
    parts.push(
      <Text key="location" style={autoFixStyles.contactItem}>
        {contact.location}
      </Text>
    );
  }

  if (parts.length === 0) {
    return <Text style={autoFixStyles.contactLine}>email@example.com | (555) 123-4567</Text>;
  }

  return (
    <View style={autoFixStyles.contactRow}>
      {parts.map((part, index) => (
        <View key={index} style={autoFixStyles.contactItem}>
          {part}
          {index < parts.length - 1 && (
            <Text style={autoFixStyles.separator}> • </Text>
          )}
        </View>
      ))}
    </View>
  );
};

export const generateAutoFixPDF = async (data: AutoFixResult) => {
  const AutoFixDocument = (
    <Document>
      <Page size="A4" style={autoFixStyles.page}>
        <View style={autoFixStyles.nameBlock}>
          <Text style={autoFixStyles.name}>{data.name || 'YOUR NAME'}</Text>
        </View>
        <ContactLinkRow contact={data.contact ?? {}} />

        {data.summary && (
          <View style={autoFixStyles.section}>
            <Text style={autoFixStyles.sectionTitle}>SUMMARY</Text>
            <Text style={autoFixStyles.bodyText}>{data.summary}</Text>
          </View>
        )}

        {data.experience && data.experience.length > 0 && (
          <View style={autoFixStyles.section}>
            <Text style={autoFixStyles.sectionTitle}>EXPERIENCE</Text>
            {data.experience.map((exp, i) => (
              <View key={i} style={{ marginBottom: 5 }} wrap={false}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold' }}>
                    {exp.title}{exp.company ? ` • ${exp.company}` : ''}
                  </Text>
                  {exp.duration && (
                    <Text style={{ fontSize: 10, color: '#444' }}>{exp.duration}</Text>
                  )}
                </View>
                {exp.bullets?.map((bullet, j) => (
                  <Text key={j} style={autoFixStyles.bullet}>
                    • {bullet}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {data.education && data.education.length > 0 && (
          <View style={autoFixStyles.section}>
            <Text style={autoFixStyles.sectionTitle}>EDUCATION</Text>
            {data.education.map((edu, i) => (
              <View key={i} style={{ marginBottom: 3 }} wrap={false}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold' }}>
                    {edu.degree}{edu.institution ? ` • ${edu.institution}` : ''}
                  </Text>
                  {edu.year && (
                    <Text style={{ fontSize: 10, color: '#444' }}>{edu.year}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {data.skills && data.skills.length > 0 && (
          <View style={autoFixStyles.section}>
            <Text style={autoFixStyles.sectionTitle}>SKILLS</Text>
            <Text style={autoFixStyles.skillsText}>{data.skills.join(', ')}</Text>
          </View>
        )}

        {data.projects && data.projects.length > 0 && (
          <View style={autoFixStyles.section}>
            <Text style={autoFixStyles.sectionTitle}>PROJECTS</Text>
            {data.projects.map((proj, i) => (
              <View key={i} style={{ marginBottom: 5 }} wrap={false}>
                <Text style={autoFixStyles.entryHeader}>
                  {proj.name}{proj.tech ? ` (${proj.tech})` : ''}
                </Text>
                {proj.description && (
                  <Text style={autoFixStyles.bodyText}>{proj.description}</Text>
                )}
                {proj.github_url && (
                  <Link src={normalizeUrl(proj.github_url)} style={autoFixStyles.link}>
                    GitHub Repository
                  </Link>
                )}
                {proj.achievements?.map((ach, j) => (
                  <Text key={j} style={autoFixStyles.bullet}>
                    • {ach}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );

  const asPdf = pdf();
  asPdf.updateContainer(AutoFixDocument);
  const blob = await asPdf.toBlob();

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  const fileName = data.name
    ? `${data.name.toLowerCase().replace(/\s+/g, '_')}_ats_optimized.pdf`
    : 'ats_optimized_resume.pdf';
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};
