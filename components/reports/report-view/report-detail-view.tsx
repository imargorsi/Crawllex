"use client";

import {
  ReportAreaChart,
  ReportCallout,
  ReportDonut,
  ReportKpiGrid,
  ReportList,
  ReportNote,
  ReportPanel,
  ReportParagraphs,
  ReportSubheading,
  ReportTable,
  TONE_VAR,
} from "@/components/reports/report-view/report-view-blocks";
import { Icons } from "@/lib/frontend/icons/app-icons";
import { cn } from "@/lib/utils";
import type { TBlockView, TReportView, TSectionView, TReportTone } from "@/lib/reports/view-model";

type TBlockOf<T extends TBlockView["type"]> = Extract<TBlockView, { type: T }>;

function blocksOf<T extends TBlockView["type"]>(section: TSectionView, type: T): TBlockOf<T>[] {
  return section.blocks.filter((block): block is TBlockOf<T> => block.type === type);
}

function sectionById(view: TReportView, id: TSectionView["id"]): TSectionView | undefined {
  return view.sections.find((section) => section.id === id);
}

/** Contact-style tile, same look as the other report metrics. */
function ReportChip({ label, value, tone }: { label: string; value: string; tone: TReportTone }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-bg-card/40 px-4 py-3">
      <span className="flex min-w-0 items-center gap-2 text-sm text-text-muted">
        <span className="size-2 shrink-0 rounded-full" style={{ background: TONE_VAR[tone] }} aria-hidden />
        <span className="truncate">{label}</span>
      </span>
      <span className="text-lg font-bold tabular-nums text-text-primary">{value}</span>
    </div>
  );
}

/** Two-up grid on wide screens, stacked on small screens. */
function Row({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid gap-5 xl:grid-cols-12", className)}>{children}</div>;
}

function Span({ cols, children }: { cols: 4 | 5 | 6 | 7 | 8 | 12; children: React.ReactNode }) {
  const map = { 4: "xl:col-span-4", 5: "xl:col-span-5", 6: "xl:col-span-6", 7: "xl:col-span-7", 8: "xl:col-span-8", 12: "xl:col-span-12" } as const;
  return <div className={cn("min-w-0", map[cols])}>{children}</div>;
}

export function ReportDetailView({ view }: { view: TReportView }) {
  const summary = sectionById(view, "summary");
  const search = sectionById(view, "search");
  const searchPages = sectionById(view, "searchPages");
  const traffic = sectionById(view, "traffic");
  const audience = sectionById(view, "audience");
  const engagement = sectionById(view, "engagement");
  const leads = sectionById(view, "leads");
  const notes = sectionById(view, "notes");

  return (
    <div className="space-y-5">
      {summary ? (
        <ReportPanel title={summary.title} icon={Icons.analytics} number={summary.number}>
          {blocksOf(summary, "kpis").map((block, index) => (
            <ReportKpiGrid key={index} items={block.items} />
          ))}
          <Row>
            <Span cols={6}>
              <ReportSubheading>{blocksOf(summary, "list")[0]?.title}</ReportSubheading>
              <div className="mt-3">
                <ReportList items={blocksOf(summary, "list")[0]?.items ?? []} />
              </div>
            </Span>
            <Span cols={6}>
              <ReportSubheading>{blocksOf(summary, "list")[1]?.title}</ReportSubheading>
              <div className="mt-3">
                <ReportList items={blocksOf(summary, "list")[1]?.items ?? []} />
              </div>
            </Span>
          </Row>
        </ReportPanel>
      ) : null}

      {search ? (
        <ReportPanel title={search.title} icon={Icons.cursorPointer} number={search.number}>
          <Row>
            <Span cols={12}>
              {blocksOf(search, "kpis").map((block, index) => (
                <ReportKpiGrid key={index} items={block.items} />
              ))}
            </Span>
            <Span cols={7}>
              <div className="space-y-5">
                {blocksOf(search, "paragraphs").map((block, index) => (
                  <ReportParagraphs key={index} items={block.items} />
                ))}
                {blocksOf(search, "line").map((block, index) => (
                  <ReportAreaChart key={index} chart={block.chart} />
                ))}
                {blocksOf(search, "note").map((block, index) => (
                  <ReportNote key={index} text={block.text} />
                ))}
              </div>
            </Span>
            <Span cols={5}>
              {blocksOf(search, "table").map((block, index) => (
                <div key={index} className="space-y-3">
                  <ReportSubheading>{block.title}</ReportSubheading>
                  <ReportTable table={block.table} />
                </div>
              ))}
            </Span>
          </Row>
        </ReportPanel>
      ) : null}

      {searchPages ? (
        <ReportPanel title={searchPages.title} icon={Icons.file} number={searchPages.number}>
          {blocksOf(searchPages, "table").map((block, index) => (
            <ReportTable key={index} table={block.table} />
          ))}
        </ReportPanel>
      ) : null}

      <Row>
        {traffic ? (
          <Span cols={8}>
            <ReportPanel title={traffic.title} icon={Icons.chartLine} number={traffic.number} className="h-full">
              {blocksOf(traffic, "kpis").map((block, index) => (
                <ReportKpiGrid key={index} items={block.items} />
              ))}
              {blocksOf(traffic, "paragraphs").map((block, index) => (
                <ReportParagraphs key={index} items={block.items} />
              ))}
              {blocksOf(traffic, "line").map((block, index) => (
                <ReportAreaChart key={index} chart={block.chart} />
              ))}
              {blocksOf(traffic, "note").map((block, index) => (
                <ReportNote key={index} text={block.text} />
              ))}
            </ReportPanel>
          </Span>
        ) : null}
        {traffic
          ? blocksOf(traffic, "donut").map((block, index) => (
              <Span key={index} cols={4}>
                <ReportPanel title={block.title} icon={Icons.globe} className="h-full">
                  <ReportDonut rows={block.rows} />
                </ReportPanel>
              </Span>
            ))
          : null}
      </Row>

      <Row>
        {audience
          ? blocksOf(audience, "table").map((block, index) => (
              <Span key={index} cols={index === 0 ? 5 : 7}>
                <ReportPanel title={block.title} icon={index === 0 ? Icons.globe : Icons.megaphone} number={audience.number} className="h-full">
                  <ReportTable table={block.table} />
                </ReportPanel>
              </Span>
            ))
          : null}
      </Row>

      <Row>
        {engagement ? (
          <Span cols={4}>
            <ReportPanel title={engagement.title} icon={Icons.userGroup} number={engagement.number} className="h-full">
              {blocksOf(engagement, "kpis").map((block, index) => (
                <ReportKpiGrid key={index} items={block.items} columns={2} />
              ))}
              {blocksOf(engagement, "chips").map((block, index) => (
                <div key={index} className="space-y-2.5">
                  {block.items.map((item) => (
                    <ReportChip key={item.label} label={item.label} value={item.value} tone={item.tone} />
                  ))}
                </div>
              ))}
              {blocksOf(engagement, "paragraphs").map((block, index) => (
                <ReportParagraphs key={index} items={block.items} />
              ))}
              {blocksOf(engagement, "table").map((block, index) => (
                <div key={index} className="space-y-3">
                  <ReportSubheading>{block.title}</ReportSubheading>
                  <ReportTable table={block.table} />
                </div>
              ))}
            </ReportPanel>
          </Span>
        ) : null}
        {leads ? (
          <Span cols={8}>
            <ReportPanel title={leads.title} icon={Icons.userGroup} number={leads.number} className="h-full">
              {blocksOf(leads, "kpis").map((block, index) => (
                <ReportKpiGrid key={index} items={block.items} />
              ))}
              {blocksOf(leads, "paragraphs")[0] ? <ReportParagraphs items={blocksOf(leads, "paragraphs")[0].items} /> : null}
              <Row className="gap-5">
                {blocksOf(leads, "donut").map((block, index) => (
                  <Span key={index} cols={12}>
                    <ReportSubheading>{block.title}</ReportSubheading>
                    <div className="mt-3">
                      <ReportDonut rows={block.rows} />
                    </div>
                  </Span>
                ))}
                {blocksOf(leads, "table")[0] ? (
                  <Span cols={12}>
                    <ReportSubheading>{blocksOf(leads, "table")[0].title}</ReportSubheading>
                    <div className="mt-3">
                      <ReportTable table={blocksOf(leads, "table")[0].table} />
                    </div>
                  </Span>
                ) : null}
              </Row>
              {blocksOf(leads, "paragraphs")[1] ? <ReportParagraphs items={blocksOf(leads, "paragraphs")[1].items} /> : null}
              {blocksOf(leads, "table")[1] ? (
                <div className="space-y-3">
                  <ReportSubheading>{blocksOf(leads, "table")[1].title}</ReportSubheading>
                  <ReportTable table={blocksOf(leads, "table")[1].table} />
                </div>
              ) : null}
            </ReportPanel>
          </Span>
        ) : null}
      </Row>

      {notes ? (
        <ReportPanel title={notes.title} icon={Icons.file} number={notes.number}>
          <Row>
            {blocksOf(notes, "list").map((block, index) => (
              <Span key={index} cols={4}>
                <ReportSubheading>{block.title}</ReportSubheading>
                <div className="mt-3">
                  <ReportList items={block.items} />
                </div>
              </Span>
            ))}
            {blocksOf(notes, "callout").map((block, index) => (
              <Span key={index} cols={4}>
                <ReportSubheading>{block.title}</ReportSubheading>
                <div className="mt-3">
                  <ReportCallout text={block.text} />
                </div>
              </Span>
            ))}
            {blocksOf(notes, "note").map((block, index) => (
              <Span key={index} cols={12}>
                <ReportNote text={block.text} />
              </Span>
            ))}
          </Row>
        </ReportPanel>
      ) : null}
    </div>
  );
}
