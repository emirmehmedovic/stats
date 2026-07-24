import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { TicketStatus, TicketPriority, TicketCategory, TicketLocation, TicketSystem } from '@prisma/client';

// Register Roboto font for special characters (čćžđš)
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf',
      fontWeight: 300,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf',
      fontWeight: 500,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff',
    fontFamily: 'Roboto',
  },
  header: {
    backgroundColor: '#1e3a8a',
    padding: 15,
    marginBottom: 20,
    borderRadius: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: 'Roboto',
  },
  subtitle: {
    fontSize: 10,
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: 'Roboto',
    opacity: 0.8,
  },
  filtersSection: {
    backgroundColor: '#f3f4f6',
    padding: 10,
    marginBottom: 15,
    borderRadius: 4,
  },
  filtersTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 5,
    fontFamily: 'Roboto',
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  filterChipText: {
    fontSize: 8,
    color: '#1e40af',
    fontFamily: 'Roboto',
  },
  statsSection: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 4,
    border: '1 solid #e5e7eb',
  },
  statLabel: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 2,
    fontFamily: 'Roboto',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    fontFamily: 'Roboto',
  },
  // Ticket card styles
  ticketCard: {
    border: '1 solid #d1d5db',
    borderRadius: 6,
    marginBottom: 12,
    overflow: 'hidden',
  },
  ticketHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    padding: 8,
    borderBottom: '1 solid #e5e7eb',
  },
  ticketHeaderLeft: {
    flex: 1,
  },
  ticketHeaderRight: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  ticketId: {
    fontSize: 8,
    color: '#6b7280',
    fontFamily: 'Roboto',
    marginBottom: 2,
  },
  ticketTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1f2937',
    fontFamily: 'Roboto',
  },
  ticketBody: {
    padding: 8,
  },
  ticketInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 6,
  },
  ticketInfoItem: {
    flexDirection: 'row',
    gap: 4,
  },
  ticketInfoLabel: {
    fontSize: 7,
    color: '#6b7280',
    fontFamily: 'Roboto',
  },
  ticketInfoValue: {
    fontSize: 7,
    color: '#374151',
    fontWeight: 'medium',
    fontFamily: 'Roboto',
  },
  // Comments section
  commentsSection: {
    marginTop: 6,
    paddingTop: 6,
    borderTop: '1 solid #e5e7eb',
  },
  commentsTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
    fontFamily: 'Roboto',
  },
  commentItem: {
    backgroundColor: '#f9fafb',
    padding: 6,
    borderRadius: 4,
    marginBottom: 4,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  commentAuthor: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#1e40af',
    fontFamily: 'Roboto',
  },
  commentDate: {
    fontSize: 6,
    color: '#6b7280',
    fontFamily: 'Roboto',
  },
  commentContent: {
    fontSize: 7,
    color: '#374151',
    fontFamily: 'Roboto',
    lineHeight: 1.3,
  },
  noComments: {
    fontSize: 7,
    color: '#9ca3af',
    fontStyle: 'italic',
    fontFamily: 'Roboto',
  },
  // Badge styles
  badge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 6,
    fontFamily: 'Roboto',
    textAlign: 'center',
  },
  badgeOpen: { backgroundColor: '#dbeafe' },
  badgeOpenText: { color: '#1e40af' },
  badgeInProgress: { backgroundColor: '#fef3c7' },
  badgeInProgressText: { color: '#92400e' },
  badgeResolved: { backgroundColor: '#d1fae5' },
  badgeResolvedText: { color: '#065f46' },
  badgeClosed: { backgroundColor: '#e5e7eb' },
  badgeClosedText: { color: '#374151' },
  badgeUrgent: { backgroundColor: '#fee2e2' },
  badgeUrgentText: { color: '#991b1b' },
  badgeHigh: { backgroundColor: '#ffedd5' },
  badgeHighText: { color: '#9a3412' },
  badgeMedium: { backgroundColor: '#fef9c3' },
  badgeMediumText: { color: '#854d0e' },
  badgeLow: { backgroundColor: '#ecfdf5' },
  badgeLowText: { color: '#047857' },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#6b7280',
    borderTop: '1 solid #e5e7eb',
    paddingTop: 8,
    fontFamily: 'Roboto',
  },
});

// Labels
const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Otvoren',
  IN_PROGRESS: 'U obradi',
  RESOLVED: 'Riješen',
  CLOSED: 'Zatvoren',
};

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: 'Nizak',
  MEDIUM: 'Srednji',
  HIGH: 'Visok',
  URGENT: 'Hitan',
};

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  HARDWARE: 'Hardver',
  SOFTWARE: 'Softver',
  NETWORK: 'Mreža',
  ACCESS: 'Pristup',
  EMAIL: 'Email',
  PRINTER: 'Štampač',
  OTHER: 'Ostalo',
};

const LOCATION_LABELS: Record<TicketLocation, string> = {
  CHECKIN_1: 'Check-in 1',
  CHECKIN_2: 'Check-in 2',
  CHECKIN_3: 'Check-in 3',
  CHECKIN_4: 'Check-in 4',
  CHECKIN_5: 'Check-in 5',
  CHECKIN_6: 'Check-in 6',
  CHECKIN_7: 'Check-in 7',
  CHECKIN_8: 'Check-in 8',
  BOARDING_1: 'Boarding 1',
  BOARDING_2: 'Boarding 2',
  BOARDING_3: 'Boarding 3',
  BOARDING_4: 'Boarding 4',
  OFFICE_NAPLATE: 'Kanc. Naplate',
  OFFICE_INFO: 'Kanc. Info',
  OTHER: 'Ostalo',
};

const SYSTEM_LABELS: Record<TicketSystem, string> = {
  GONOW: 'GoNow',
  DCS_CRANE: 'DCS Crane',
  NIKO: 'NIKO',
  PRINTER: 'Printer',
  OTHER: 'Ostalo',
};

interface TicketComment {
  id: string;
  content: string;
  createdAt: string | Date;
  author: {
    name: string | null;
  };
}

interface TicketUser {
  id: string;
  name: string | null;
  email: string;
}

interface TicketData {
  id: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  location: TicketLocation | null;
  system: TicketSystem | null;
  reporterName: string | null;
  submittedBy: TicketUser;
  createdAt: string | Date;
  comments?: TicketComment[];
}

interface FilterInfo {
  search?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  location?: TicketLocation;
  system?: TicketSystem;
  dateFrom?: string;
  dateTo?: string;
  reporterName?: string;
}

interface SupportTicketsPDFProps {
  tickets: TicketData[];
  filters: FilterInfo;
  generatedAt: Date;
}

// Format date
function formatDate(date: Date | string): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

// Format date with time
function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

// Status badge component
const StatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => {
  const badgeColors: Record<TicketStatus, { bg: any; text: any }> = {
    OPEN: { bg: styles.badgeOpen, text: styles.badgeOpenText },
    IN_PROGRESS: { bg: styles.badgeInProgress, text: styles.badgeInProgressText },
    RESOLVED: { bg: styles.badgeResolved, text: styles.badgeResolvedText },
    CLOSED: { bg: styles.badgeClosed, text: styles.badgeClosedText },
  };
  const colors = badgeColors[status];
  return (
    <View style={[styles.badge, colors.bg]}>
      <Text style={[styles.badgeText, colors.text]}>{STATUS_LABELS[status]}</Text>
    </View>
  );
};

// Priority badge component
const PriorityBadge: React.FC<{ priority: TicketPriority }> = ({ priority }) => {
  const badgeColors: Record<TicketPriority, { bg: any; text: any }> = {
    URGENT: { bg: styles.badgeUrgent, text: styles.badgeUrgentText },
    HIGH: { bg: styles.badgeHigh, text: styles.badgeHighText },
    MEDIUM: { bg: styles.badgeMedium, text: styles.badgeMediumText },
    LOW: { bg: styles.badgeLow, text: styles.badgeLowText },
  };
  const colors = badgeColors[priority];
  return (
    <View style={[styles.badge, colors.bg]}>
      <Text style={[styles.badgeText, colors.text]}>{PRIORITY_LABELS[priority]}</Text>
    </View>
  );
};

// Ticket card component
const TicketCard: React.FC<{ ticket: TicketData }> = ({ ticket }) => {
  const comments = ticket.comments || [];

  return (
    <View style={styles.ticketCard} wrap={false}>
      {/* Header */}
      <View style={styles.ticketHeader}>
        <View style={styles.ticketHeaderLeft}>
          <Text style={styles.ticketId}>#{ticket.id.slice(-6)} | {formatDate(ticket.createdAt)}</Text>
          <Text style={styles.ticketTitle}>{ticket.title}</Text>
        </View>
        <View style={styles.ticketHeaderRight}>
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </View>
      </View>

      {/* Body */}
      <View style={styles.ticketBody}>
        {/* Info row */}
        <View style={styles.ticketInfoRow}>
          <View style={styles.ticketInfoItem}>
            <Text style={styles.ticketInfoLabel}>Reporter:</Text>
            <Text style={styles.ticketInfoValue}>{ticket.reporterName || ticket.submittedBy.name || '-'}</Text>
          </View>
          <View style={styles.ticketInfoItem}>
            <Text style={styles.ticketInfoLabel}>Kategorija:</Text>
            <Text style={styles.ticketInfoValue}>{CATEGORY_LABELS[ticket.category]}</Text>
          </View>
          {ticket.location && (
            <View style={styles.ticketInfoItem}>
              <Text style={styles.ticketInfoLabel}>Lokacija:</Text>
              <Text style={styles.ticketInfoValue}>{LOCATION_LABELS[ticket.location]}</Text>
            </View>
          )}
          {ticket.system && (
            <View style={styles.ticketInfoItem}>
              <Text style={styles.ticketInfoLabel}>Sistem:</Text>
              <Text style={styles.ticketInfoValue}>{SYSTEM_LABELS[ticket.system]}</Text>
            </View>
          )}
        </View>

        {/* Comments section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Komentari ({comments.length}):</Text>
          {comments.length > 0 ? (
            comments.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentAuthor}>{comment.author.name || 'Nepoznato'}</Text>
                  <Text style={styles.commentDate}>{formatDateTime(comment.createdAt)}</Text>
                </View>
                <Text style={styles.commentContent}>
                  {comment.content.length > 200 ? comment.content.slice(0, 200) + '...' : comment.content}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noComments}>Nema komentara</Text>
          )}
        </View>
      </View>
    </View>
  );
};

// Active filters display
const ActiveFilters: React.FC<{ filters: FilterInfo }> = ({ filters }) => {
  const activeFilters: string[] = [];

  if (filters.search) activeFilters.push(`Pretraga: "${filters.search}"`);
  if (filters.reporterName) activeFilters.push(`Reporter: "${filters.reporterName}"`);
  if (filters.status) activeFilters.push(`Status: ${STATUS_LABELS[filters.status]}`);
  if (filters.priority) activeFilters.push(`Prioritet: ${PRIORITY_LABELS[filters.priority]}`);
  if (filters.category) activeFilters.push(`Kategorija: ${CATEGORY_LABELS[filters.category]}`);
  if (filters.location) activeFilters.push(`Lokacija: ${LOCATION_LABELS[filters.location]}`);
  if (filters.system) activeFilters.push(`Sistem: ${SYSTEM_LABELS[filters.system]}`);
  if (filters.dateFrom) activeFilters.push(`Od: ${filters.dateFrom}`);
  if (filters.dateTo) activeFilters.push(`Do: ${filters.dateTo}`);

  if (activeFilters.length === 0) return null;

  return (
    <View style={styles.filtersSection}>
      <Text style={styles.filtersTitle}>Primijenjeni filteri:</Text>
      <View style={styles.filtersRow}>
        {activeFilters.map((filter, index) => (
          <View key={index} style={styles.filterChip}>
            <Text style={styles.filterChipText}>{filter}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// Main PDF Document
export const SupportTicketsPDF: React.FC<SupportTicketsPDFProps> = ({
  tickets,
  filters,
  generatedAt,
}) => {
  // Calculate statistics
  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'OPEN').length,
    inProgress: tickets.filter((t) => t.status === 'IN_PROGRESS').length,
    resolved: tickets.filter((t) => t.status === 'RESOLVED').length,
    closed: tickets.filter((t) => t.status === 'CLOSED').length,
    totalComments: tickets.reduce((sum, t) => sum + (t.comments?.length || 0), 0),
  };

  return (
    <Document title="IT Support Tiketi - Izvještaj">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>IT SUPPORT TIKETI - IZVJEŠTAJ</Text>
          <Text style={styles.subtitle}>
            Generisano: {formatDate(generatedAt)} | Međunarodni aerodrom Tuzla
          </Text>
        </View>

        {/* Active Filters */}
        <ActiveFilters filters={filters} />

        {/* Statistics */}
        <View style={styles.statsSection}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Ukupno tiketa</Text>
            <Text style={styles.statValue}>{stats.total}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Otvoreni</Text>
            <Text style={styles.statValue}>{stats.open}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>U obradi</Text>
            <Text style={styles.statValue}>{stats.inProgress}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Riješeni</Text>
            <Text style={styles.statValue}>{stats.resolved}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Komentara</Text>
            <Text style={styles.statValue}>{stats.totalComments}</Text>
          </View>
        </View>

        {/* Tickets */}
        {tickets.length > 0 ? (
          tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))
        ) : (
          <View style={{ padding: 20, textAlign: 'center' }}>
            <Text style={{ fontSize: 10, color: '#6b7280', fontFamily: 'Roboto' }}>
              Nema tiketa za prikaz sa odabranim filterima
            </Text>
          </View>
        )}

        {/* Footer */}
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Međunarodni aerodrom Tuzla | IT Support Izvještaj | Stranica ${pageNumber} od ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
};
