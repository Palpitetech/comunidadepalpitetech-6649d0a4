import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";
import { useDisparoManual } from "@/hooks/useDisparoManual";
import { DisparoPublicoFilter } from "./disparo/DisparoPublicoFilter";
import { DisparoMessageComposer } from "./disparo/DisparoMessageComposer";
import { DisparoConfirmDialog } from "./disparo/DisparoConfirmDialog";

export function DisparoManualTab() {
  const dm = useDisparoManual();

  return (
    <div className="space-y-6 pt-2">
      {/* ── FILTRO DE PÚBLICO ── */}
      <DisparoPublicoFilter
        allTags={dm.allTags}
        includeTags={dm.includeTags}
        excludeTags={dm.excludeTags}
        exactMatch={dm.exactMatch}
        onToggleInclude={(tag) => dm.toggleTag(tag, dm.includeTags, dm.setIncludeTags)}
        onToggleExclude={(tag) => dm.toggleTag(tag, dm.excludeTags, dm.setExcludeTags)}
        onExactMatchChange={dm.setExactMatch}
        plans={dm.plans}
        selectedPlanIds={dm.selectedPlanIds}
        onPlanToggle={(id) => {
          dm.setSelectedPlanIds((prev) =>
            prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
          );
        }}
        selectedStatus={dm.selectedStatus}
        onStatusChange={(v) => dm.setSelectedStatus(v === "all" ? "" : v)}
        selectedVerification={dm.selectedVerification}
        onVerificationChange={dm.setSelectedVerification}
        eventTypes={dm.eventTypes}
        selectedEvent={dm.selectedEvent}
        onEventChange={(v) => dm.setSelectedEvent(v === "none" ? "" : v)}
        contactCount={dm.contactCount}
        countLoading={dm.countLoading}
        activeFilters={dm.activeFilters}
      />

      {/* ── MENSAGEM ── */}
      <DisparoMessageComposer
        messageMode={dm.messageMode}
        onModeChange={dm.setMessageMode}
        templates={dm.templates}
        selectedTemplateId={dm.selectedTemplateId}
        onTemplateChange={dm.setSelectedTemplateId}
        selectedTemplate={dm.selectedTemplate}
        freeMessage={dm.freeMessage}
        onFreeMessageChange={dm.setFreeMessage}
        textareaRef={dm.textareaRef}
        onInsertVariable={dm.insertVariable}
        variables={dm.VARIABLES}
      />

      {/* ── BOTÃO DISPARAR ── */}
      <Button
        className="w-full gap-2"
        size="lg"
        disabled={!dm.canDispatch || dm.dispatching}
        onClick={() => dm.setConfirmOpen(true)}
      >
        {dm.dispatching ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        Disparar para {dm.contactCount ?? 0} contatos
      </Button>

      {/* ── CONFIRMAÇÃO ── */}
      <DisparoConfirmDialog
        open={dm.confirmOpen}
        onOpenChange={dm.setConfirmOpen}
        contactCount={dm.contactCount}
        activeFilters={dm.activeFilters}
        onConfirm={dm.handleDispatch}
      />
    </div>
  );
}
