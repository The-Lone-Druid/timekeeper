import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import * as XLSX from "xlsx";
import { registerSW, showInstallPrompt } from "./register-sw";

interface TimeEntry {
  time: string;
  comment: string;
  ticketRef: string;
  timestamp: number;
  date: string;
}

@customElement("time-tracker")
export class TimeTracker extends LitElement {
  @state()
  private entries: TimeEntry[] = [];

  @state()
  private timeInput = "";

  @state()
  private commentInput = "";

  @state()
  private ticketRefInput = "";

  @state()
  private selectedDate = new Date().toISOString().split("T")[0];

  @state()
  private showHistory = false;

  @state()
  private showTicketInfo = false;

  @state()
  private timeError = "";

  @state()
  private commentError = "";

  @state()
  private editingEntry: TimeEntry | null = null;

  @state()
  private currentPage = 1;

  @state()
  private itemsPerPage = 5;

  connectedCallback() {
    super.connectedCallback();
    this.loadEntries();
    registerSW();
  }

  private loadEntries() {
    const savedEntries = localStorage.getItem("timeEntries");
    if (savedEntries) {
      this.entries = JSON.parse(savedEntries);
    }
  }

  private saveEntries() {
    localStorage.setItem("timeEntries", JSON.stringify(this.entries));
  }

  private parseTimeString(timeStr: string): number {
    const timeRegex = /(\d+d)?\s*(\d+h)?\s*(\d+m)?\s*(\d+s)?/;
    const match = timeStr.match(timeRegex);
    if (!match) return 0;

    const [, days, hours, minutes, seconds] = match;
    let totalHours = 0;

    if (days) totalHours += parseInt(days) * 24;
    if (hours) totalHours += parseInt(hours);
    if (minutes) totalHours += parseInt(minutes) / 60;
    if (seconds) totalHours += parseInt(seconds) / 3600;

    return totalHours;
  }

  private getTotalHours(date?: string): number {
    const entries = date
      ? this.entries.filter((entry) => entry.date === date)
      : this.entries.filter((entry) => entry.date === this.selectedDate);

    return entries.reduce((total, entry) => {
      return total + this.parseTimeString(entry.time);
    }, 0);
  }

  private validateTime(timeStr: string): boolean {
    const timeRegex = /^(\d+d\s*)?(\d+h\s*)?(\d+m\s*)?(\d+s\s*)?$/;
    return timeRegex.test(timeStr.trim());
  }

  private validateForm(): boolean {
    let isValid = true;

    // Validate time
    if (!this.timeInput.trim()) {
      this.timeError = "Time is required";
      isValid = false;
    } else if (!this.validateTime(this.timeInput)) {
      this.timeError =
        "Invalid time format. Use format like: 1h 45m or 2d 1h 45m 35s";
      isValid = false;
    } else {
      this.timeError = "";
    }

    // Validate comment
    if (!this.commentInput.trim()) {
      this.commentError = "Comment is required";
      isValid = false;
    } else {
      this.commentError = "";
    }

    return isValid;
  }

  private handleEdit(entry: TimeEntry) {
    this.editingEntry = entry;
    this.timeInput = entry.time;
    this.commentInput = entry.comment;
    this.ticketRefInput = entry.ticketRef;
  }

  private handleDelete(entry: TimeEntry) {
    if (confirm("Are you sure you want to delete this entry?")) {
      this.entries = this.entries.filter(
        (e) => e.timestamp !== entry.timestamp
      );
      this.saveEntries();
    }
  }

  private handleSubmit(e: Event) {
    e.preventDefault();
    if (!this.validateForm()) return;

    if (this.editingEntry) {
      // Update existing entry
      this.entries = this.entries.map((entry) =>
        entry.timestamp === this.editingEntry!.timestamp
          ? {
              ...entry,
              time: this.timeInput,
              comment: this.commentInput,
              ticketRef: this.ticketRefInput,
            }
          : entry
      );
      this.editingEntry = null;
    } else {
      // Add new entry
      this.entries = [
        ...this.entries,
        {
          time: this.timeInput,
          comment: this.commentInput,
          ticketRef: this.ticketRefInput,
          timestamp: Date.now(),
          date: this.selectedDate,
        },
      ];
    }

    this.timeInput = "";
    this.commentInput = "";
    this.ticketRefInput = "";
    this.timeError = "";
    this.commentError = "";
    this.saveEntries();
  }

  private handleCancel() {
    this.editingEntry = null;
    this.timeInput = "";
    this.commentInput = "";
    this.ticketRefInput = "";
    this.timeError = "";
    this.commentError = "";
  }

  private formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  private getUniqueDates(): string[] {
    return [...new Set(this.entries.map((entry) => entry.date))].sort((a, b) =>
      b.localeCompare(a)
    );
  }

  private getMaxDate(): string {
    return new Date().toISOString().split("T")[0];
  }

  private isToday(date: string): boolean {
    const today = new Date().toISOString().split("T")[0];
    return date === today;
  }

  private formatTitleDate(date: string): string {
    if (this.isToday(date)) {
      return "Today's Entries";
    }
    return `Entries for ${this.formatDate(date)}`;
  }

  private handleDateSelect(date: string) {
    this.selectedDate = date;
    this.showHistory = false;
  }

  private getPaginatedDates(): string[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.getUniqueDates().slice(start, end);
  }

  private getTotalPages(): number {
    return Math.ceil(this.getUniqueDates().length / this.itemsPerPage);
  }

  private handlePageChange(page: number) {
    this.currentPage = page;
  }

  private exportToExcel() {
    // Group entries by date
    const groupedEntries = this.entries.reduce((acc, entry) => {
      if (!acc[entry.date]) {
        acc[entry.date] = [];
      }
      acc[entry.date].push(entry);
      return acc;
    }, {} as Record<string, TimeEntry[]>);

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Create a worksheet for each date
    Object.entries(groupedEntries).forEach(([date, entries]) => {
      // Convert entries to worksheet data
      const wsData = [
        ["Date", "Time", "Ticket Reference", "Comment", "Total Hours"],
        ...entries.map((entry) => [
          this.formatDate(date),
          entry.time,
          entry.ticketRef || "-",
          entry.comment,
          this.parseTimeString(entry.time).toFixed(2),
        ]),
        ["", "", "", "TOTAL HOURS", this.getTotalHours(date).toFixed(2)],
      ];

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Set column widths
      const colWidths = [
        { wch: 20 }, // Date
        { wch: 15 }, // Time
        { wch: 20 }, // Ticket Reference
        { wch: 50 }, // Comment
        { wch: 15 }, // Total Hours
      ];
      ws["!cols"] = colWidths;

      // Add styling for headers and total row
      const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
      const lastRow = range.e.r;

      // Style headers
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const headerCell = XLSX.utils.encode_cell({ r: 0, c: C });
        ws[headerCell].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "4A90E2" } },
          alignment: { horizontal: "center" },
        };
      }

      // Style total row
      const totalLabelCell = XLSX.utils.encode_cell({ r: lastRow, c: 3 });
      const totalValueCell = XLSX.utils.encode_cell({ r: lastRow, c: 4 });

      ws[totalLabelCell].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "2ECC71" } },
        alignment: { horizontal: "right" },
      };

      ws[totalValueCell].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "2ECC71" } },
        alignment: { horizontal: "center" },
      };

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, date);
    });

    // Generate Excel file
    const fileName = `hours-tracker-${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  render() {
    const todayEntries = this.entries.filter(
      (entry) => entry.date === this.selectedDate
    );
    const paginatedDates = this.getPaginatedDates();
    const totalPages = this.getTotalPages();

    return html`
      <div class="container">
        <div class="header">
          <h1>Hours Tracker</h1>
          <div class="header-actions">
            <button
              id="install-button"
              class="install-button"
              @click=${showInstallPrompt}
              style="display: none;"
            >
              <span class="install-icon">📱</span>
              Install App
            </button>
            <div class="date-selector">
              <label for="date">Select Date:</label>
              <input
                type="date"
                id="date"
                .value=${this.selectedDate}
                @input=${(e: Event) =>
                  (this.selectedDate = (e.target as HTMLInputElement).value)}
                max=${this.getMaxDate()}
              />
            </div>
          </div>
        </div>

        <form @submit=${this.handleSubmit} class="form">
          <div class="form-row">
            <div class="input-group">
              <label for="time">Time (e.g., 1h 45m):</label>
              <input
                id="time"
                .value=${this.timeInput}
                @input=${(e: Event) => {
                  this.timeInput = (e.target as HTMLInputElement).value;
                  this.validateForm();
                }}
                placeholder="1h 45m"
                class=${this.timeError ? "error" : ""}
              />
              ${this.timeError
                ? html` <span class="error-message">${this.timeError}</span> `
                : ""}
            </div>

            <div class="input-group">
              <label for="ticketRef">
                Ticket Reference
                <span
                  class="info-icon"
                  @mouseenter=${() => (this.showTicketInfo = true)}
                  @mouseleave=${() => (this.showTicketInfo = false)}
                >
                  ℹ️
                  ${this.showTicketInfo
                    ? html`
                        <div class="info-tooltip">
                          Enter ticket number, title, or reference (e.g.,
                          "#123", "PROJ-123", "Bug Fix: Login Issue")
                        </div>
                      `
                    : ""}
                </span>
              </label>
              <input
                id="ticketRef"
                .value=${this.ticketRefInput}
                @input=${(e: Event) =>
                  (this.ticketRefInput = (e.target as HTMLInputElement).value)}
                placeholder="#123, PROJ-123 or Bug Fix: Login Issue"
              />
            </div>
          </div>

          <div class="input-group">
            <label for="comment">Comment:</label>
            <input
              id="comment"
              .value=${this.commentInput}
              @input=${(e: Event) => {
                this.commentInput = (e.target as HTMLInputElement).value;
                this.validateForm();
              }}
              placeholder="What did you work on?"
              class=${this.commentError ? "error" : ""}
            />
            ${this.commentError
              ? html` <span class="error-message">${this.commentError}</span> `
              : ""}
          </div>

          <div class="form-actions">
            ${this.editingEntry
              ? html`
                  <button
                    type="button"
                    class="cancel-button"
                    @click=${this.handleCancel}
                  >
                    Cancel
                  </button>
                `
              : ""}
            <button type="submit">
              ${this.editingEntry ? "Update Entry" : "Add Entry"}
            </button>
          </div>
        </form>

        <div class="entries-container">
          <div class="entries-header">
            <h2>${this.formatTitleDate(this.selectedDate)}</h2>
            <div class="header-actions">
              <button
                class="history-toggle"
                @click=${() => {
                  this.showHistory = !this.showHistory;
                  this.currentPage = 1;
                }}
              >
                ${this.showHistory ? "Hide History" : "Show History"}
              </button>
              ${this.showHistory
                ? html`
                    <button class="export-button" @click=${this.exportToExcel}>
                      Export to Excel
                    </button>
                  `
                : ""}
            </div>
          </div>

          ${this.showHistory
            ? html`
                <div class="history">
                  ${paginatedDates.map(
                    (date) => html`
                      <div class="history-date">
                        <div class="history-date-header">
                          <div class="date-info">
                            <h3>${this.formatDate(date)}</h3>
                            <span class="total-hours"
                              >${this.getTotalHours(date).toFixed(2)}h
                              total</span
                            >
                          </div>
                          <button
                            class="select-date-button"
                            @click=${() => this.handleDateSelect(date)}
                          >
                            View Entries
                          </button>
                        </div>
                        <div class="history-entries">
                          ${this.entries
                            .filter((entry) => entry.date === date)
                            .map(
                              (entry) => html`
                                <div class="entry">
                                  <div class="entry-content">
                                    <span class="time">${entry.time}</span>
                                    ${entry.ticketRef
                                      ? html`
                                          <span class="ticket-ref"
                                            >${entry.ticketRef}</span
                                          >
                                        `
                                      : ""}
                                    <span class="comment"
                                      >${entry.comment}</span
                                    >
                                  </div>
                                  <div class="entry-actions">
                                    <button
                                      class="edit-button"
                                      @click=${() => this.handleEdit(entry)}
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      class="delete-button"
                                      @click=${() => this.handleDelete(entry)}
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </div>
                              `
                            )}
                        </div>
                      </div>
                    `
                  )}
                  ${totalPages > 1
                    ? html`
                        <div class="pagination">
                          <button
                            class="page-button"
                            ?disabled=${this.currentPage === 1}
                            @click=${() =>
                              this.handlePageChange(this.currentPage - 1)}
                          >
                            Previous
                          </button>
                          <span class="page-info">
                            Page ${this.currentPage} of ${totalPages}
                          </span>
                          <button
                            class="page-button"
                            ?disabled=${this.currentPage === totalPages}
                            @click=${() =>
                              this.handlePageChange(this.currentPage + 1)}
                          >
                            Next
                          </button>
                        </div>
                      `
                    : ""}
                </div>
              `
            : html`
                <div class="entries">
                  ${todayEntries.map(
                    (entry) => html`
                      <div class="entry">
                        <div class="entry-content">
                          <span class="time">${entry.time}</span>
                          ${entry.ticketRef
                            ? html`
                                <span class="ticket-ref"
                                  >${entry.ticketRef}</span
                                >
                              `
                            : ""}
                          <span class="comment">${entry.comment}</span>
                        </div>
                        <div class="entry-actions">
                          <button
                            class="edit-button"
                            @click=${() => this.handleEdit(entry)}
                          >
                            ✏️
                          </button>
                          <button
                            class="delete-button"
                            @click=${() => this.handleDelete(entry)}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    `
                  )}
                </div>
              `}
        </div>

        <div class="footer">
          Total Hours for ${this.formatDate(this.selectedDate)}:
          ${this.getTotalHours().toFixed(2)}h
        </div>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      background-color: #f8f9fa;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    h1 {
      margin: 0;
      color: #2c3e50;
      font-size: 2rem;
    }

    .date-selector {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .date-selector label {
      font-weight: 500;
      color: #2c3e50;
    }

    .date-selector input {
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }

    .form {
      background-color: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
    }

    .form-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .form-row .input-group {
      flex: 1;
      margin-bottom: 0;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1rem;
    }

    label {
      font-weight: 500;
      color: #2c3e50;
    }

    input {
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
      transition: border-color 0.25s;
    }

    input:focus {
      outline: none;
      border-color: #646cff;
    }

    button {
      padding: 0.75rem 1.5rem;
      background-color: #646cff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
      transition: background-color 0.25s;
    }

    button:hover {
      background-color: #535bf2;
    }

    .entries-container {
      background-color: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
    }

    .entries-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    h2 {
      margin: 0;
      color: #2c3e50;
      font-size: 1.5rem;
    }

    .history-toggle {
      background-color: #f1f3f5;
      color: #2c3e50;
    }

    .history-toggle:hover {
      background-color: #e9ecef;
    }

    .entries,
    .history-entries {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .entry {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background-color: #f8f9fa;
      border-radius: 4px;
      border-left: 4px solid #646cff;
    }

    .entry-content {
      flex: 1;
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .entry-actions {
      display: flex;
      gap: 0.5rem;
    }

    .edit-button,
    .delete-button {
      padding: 0.5rem;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      transition: transform 0.2s;
    }

    .edit-button:hover,
    .delete-button:hover {
      transform: scale(1.1);
    }

    .delete-button {
      color: #dc3545;
    }

    .time {
      font-weight: 500;
      min-width: 100px;
      color: #2c3e50;
    }

    .comment {
      color: #495057;
    }

    .history {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      max-height: 70vh;
      overflow-y: auto;
      padding-right: 0.5rem;
      border-radius: 12px;
      padding: 1.5rem;
      background-color: white;
    }

    .history::-webkit-scrollbar {
      width: 8px;
    }

    .history::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }

    .history::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 4px;
    }

    .history::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }

    .history-date {
      background-color: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      transition: transform 0.2s, box-shadow 0.2s;
      border: 1px solid #e9ecef;
    }

    .history-date:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    }

    .history-date-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem;
      background-color: #f8f9fa;
      border-radius: 12px 12px 0 0;
      border-bottom: 1px solid #e9ecef;
    }

    .date-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .date-info h3 {
      margin: 0;
      color: #2c3e50;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .total-hours {
      color: #646cff;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .history-entries {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .select-date-button {
      padding: 0.5rem 1.25rem;
      background-color: #646cff;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s;
    }

    .select-date-button:hover {
      background-color: #535bf2;
      transform: translateY(-1px);
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 1rem;
      padding: 1rem;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .page-button {
      padding: 0.5rem 1rem;
      background-color: #f8f9fa;
      color: #2c3e50;
      border: 1px solid #e9ecef;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s;
    }

    .page-button:hover:not(:disabled) {
      background-color: #e9ecef;
      transform: translateY(-1px);
    }

    .page-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-info {
      color: #6c757d;
      font-size: 0.875rem;
    }

    .footer {
      padding: 1.5rem;
      background-color: #646cff;
      color: white;
      text-align: center;
      border-radius: 8px;
      font-weight: 500;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .info-icon {
      position: relative;
      display: inline-block;
      margin-left: 0.5rem;
      cursor: help;
    }

    .info-tooltip {
      position: absolute;
      top: -50px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #2c3e50;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-size: 0.875rem;
      width: max-content;
      max-width: 300px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      z-index: 1000;
    }

    .info-tooltip::after {
      content: "";
      position: absolute;
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
      border-width: 8px 8px 0;
      border-style: solid;
      border-color: #2c3e50 transparent transparent;
    }

    .ticket-ref {
      background-color: #e9ecef;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.875rem;
      color: #495057;
      white-space: nowrap;
    }

    input.error {
      border-color: #dc3545;
    }

    .error-message {
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .cancel-button {
      background-color: #6c757d;
    }

    .cancel-button:hover {
      background-color: #5a6268;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .export-button {
      padding: 0.5rem 1.25rem;
      background-color: #28a745;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s;
    }

    .export-button:hover {
      background-color: #218838;
      transform: translateY(-1px);
    }

    .install-button {
      background-color: #28a745;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 0.75rem 1.25rem;
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .install-button:hover {
      background-color: #218838;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    .install-icon {
      font-size: 1.25rem;
    }

    @media (prefers-color-scheme: dark) {
      :host {
        background-color: #1a1a1a;
      }

      .form,
      .entries-container,
      .history-date {
        background-color: #2d2d2d;
      }

      h1,
      h2,
      h3,
      .time,
      .history-total,
      label {
        color: #f8f9fa;
      }

      .comment {
        color: #adb5bd;
      }

      .entry {
        background-color: #1a1a1a;
      }

      input {
        background-color: #2d2d2d;
        color: #f8f9fa;
        border-color: #444;
      }

      .history-toggle {
        background-color: #2d2d2d;
        color: #f8f9fa;
      }

      .history-toggle:hover {
        background-color: #3d3d3d;
      }

      .ticket-ref {
        background-color: #2d2d2d;
        color: #adb5bd;
      }

      .info-tooltip {
        background-color: #1a1a1a;
      }

      .info-tooltip::after {
        border-color: #1a1a1a transparent transparent;
      }

      .error-message {
        color: #ff6b6b;
      }

      input.error {
        border-color: #ff6b6b;
      }

      .cancel-button {
        background-color: #5a6268;
      }

      .cancel-button:hover {
        background-color: #4e555b;
      }

      .edit-button,
      .delete-button {
        color: #adb5bd;
      }

      .delete-button:hover {
        color: #ff6b6b;
      }

      .history-date {
        background-color: #2d2d2d;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        border-color: #3d3d3d;
      }

      .history-date:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }

      .history-date-header {
        background-color: #1a1a1a;
        border-bottom-color: #3d3d3d;
      }

      .date-info h3 {
        color: #f8f9fa;
      }

      .total-hours {
        color: #8b95ff;
      }

      .history-entries {
        background-color: #2d2d2d;
      }

      .pagination {
        background-color: #2d2d2d;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }

      .page-button {
        background-color: #1a1a1a;
        border-color: #3d3d3d;
        color: #f8f9fa;
      }

      .page-button:hover:not(:disabled) {
        background-color: #2d2d2d;
      }

      .page-info {
        color: #adb5bd;
      }

      .history {
        border-color: #3d3d3d;
        background-color: #2d2d2d;
      }

      .export-button {
        background-color: #2ecc71;
      }

      .export-button:hover {
        background-color: #27ae60;
      }

      .install-button {
        background-color: #2ecc71;
      }

      .install-button:hover {
        background-color: #27ae60;
      }
    }

    @media (max-width: 600px) {
      .form-row {
        flex-direction: column;
        gap: 1rem;
      }

      .form-row .input-group {
        margin-bottom: 0;
      }

      .container {
        padding: 1rem;
      }

      .form {
        padding: 1rem;
      }

      .entry {
        flex-direction: column;
        align-items: stretch;
        gap: 0.75rem;
      }

      .entry-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .time {
        min-width: unset;
      }

      .entry-actions {
        justify-content: flex-end;
        padding-top: 0.5rem;
        border-top: 1px solid #e9ecef;
      }

      .header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
        text-align: center;
      }

      .date-selector {
        flex-direction: column;
        align-items: stretch;
      }

      .entries-header {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }

      .header-actions {
        justify-content: center;
      }

      .entries-container {
        padding: 1rem;
      }

      .history-date-header {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }

      .select-date-button {
        width: 100%;
      }

      @media (prefers-color-scheme: dark) {
        .entry-actions {
          border-top-color: #3d3d3d;
        }
      }

      .install-button {
        width: 100%;
        justify-content: center;
        margin-bottom: 1rem;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "time-tracker": TimeTracker;
  }
}
