/**
 * ImportPreview Component
 *
 * Shows a preview table of the first 10 rows of a parsed import file.
 * Displays column headers and highlights rows with validation issues.
 *
 * Requirements: 7.3
 */

import { type ImportRowError } from '@/lib/validators/import';

export interface ImportPreviewProps {
  headers: string[];
  rows: Record<string, string>[];
  rowErrors: Map<number, ImportRowError[]>;
}

/**
 * Displays a preview table with the first 10 records from the import file.
 * Rows with validation issues are highlighted with a visual indicator.
 */
export function ImportPreview({ headers, rows, rowErrors }: ImportPreviewProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-border p-4 text-center text-sm text-muted-foreground">
        No hay registros para previsualizar.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">
        Vista previa ({rows.length} {rows.length === 1 ? 'registro' : 'registros'})
      </h3>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                #
              </th>
              {headers.map((header) => (
                <th
                  key={header}
                  className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                Estado
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const rowNumber = index + 2; // +2 because row 1 is header
              const errors = rowErrors.get(rowNumber);
              const hasErrors = errors && errors.length > 0;

              return (
                <tr
                  key={index}
                  className={`border-b border-border last:border-0 ${
                    hasErrors ? 'bg-destructive/5' : ''
                  }`}
                >
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {rowNumber}
                  </td>
                  {headers.map((header) => (
                    <td
                      key={header}
                      className="px-3 py-2 whitespace-nowrap max-w-[200px] truncate"
                    >
                      {row[header] ?? ''}
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    {hasErrors ? (
                      <span
                        className="inline-flex items-center gap-1 text-xs text-destructive"
                        title={errors.map((e) => `${e.field}: ${e.message}`).join('; ')}
                      >
                        <svg
                          className="size-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                          />
                        </svg>
                        Error
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                        <svg
                          className="size-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                          />
                        </svg>
                        OK
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rowErrors.size > 0 && (
        <p className="text-xs text-muted-foreground">
          {rowErrors.size} fila(s) en vista previa con problemas de validación.
        </p>
      )}
    </div>
  );
}
