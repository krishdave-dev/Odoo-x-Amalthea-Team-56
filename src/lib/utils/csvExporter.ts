/**
 * CSV Exporter Utility
 * Converts data to CSV format
 */

export class CSVExporter {
  /**
   * Convert events to CSV format
   */
  static generateEventsCSV(events: any[]): string {
    if (events.length === 0) {
      return 'No events to export'
    }

    // CSV headers
    const headers = [
      'Event ID',
      'Entity Type',
      'Entity ID',
      'Event Type',
      'Payload',
      'Created At',
    ]

    // CSV rows
    const rows = events.map(event => [
      event.id,
      event.entityType,
      event.entityId || '',
      event.eventType,
      JSON.stringify(event.payload || {}),
      new Date(event.createdAt).toISOString(),
    ])

    // Build CSV string
    const csvLines = [
      headers.join(','),
      ...rows.map(row => row.map(cell => this.escapeCSV(String(cell))).join(',')),
    ]

    return csvLines.join('\n')
  }

  /**
   * Escape CSV special characters
   */
  private static escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  /**
   * Generate CSV filename with timestamp
   */
  static generateFilename(prefix: string = 'events'): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)
    return `${prefix}_${timestamp}.csv`
  }
}

export const csvExporter = CSVExporter
