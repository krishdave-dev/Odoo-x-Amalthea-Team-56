/**
 * ExportService - Centralized Export Handler
 * Supports CSV, Excel, and PDF formats
 */

import { csvExporter } from '@/lib/utils/csvExporter'
import { excelExporter } from '@/lib/utils/excelExporter'
import { pdfExporter } from '@/lib/utils/pdfExporter'

export type ExportFormat = 'csv' | 'xlsx' | 'pdf'

export interface ExportResult {
  data: string
  filename: string
  mimeType: string
}

export class ExportService {
  /**
   * Export events to specified format
   */
  static exportEvents(
    events: any[],
    format: ExportFormat,
    filenamePrefix: string = 'events'
  ): ExportResult {
    switch (format) {
      case 'csv':
        return {
          data: csvExporter.generateEventsCSV(events),
          filename: csvExporter.generateFilename(filenamePrefix),
          mimeType: 'text/csv',
        }

      case 'xlsx':
        return {
          data: excelExporter.generateEventsExcel(events),
          filename: excelExporter.generateFilename(filenamePrefix),
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }

      case 'pdf':
        return {
          data: pdfExporter.generateEventsPDF(events),
          filename: pdfExporter.generateFilename(filenamePrefix),
          mimeType: 'application/pdf',
        }

      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  /**
   * Get content disposition header for download
   */
  static getContentDisposition(filename: string): string {
    return `attachment; filename="${filename}"`
  }

  /**
   * Validate export format
   */
  static isValidFormat(format: string): format is ExportFormat {
    return ['csv', 'xlsx', 'pdf'].includes(format)
  }
}

export const exportService = ExportService
