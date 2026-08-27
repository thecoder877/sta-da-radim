"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RequestRow {
  id: string;
  place_key: string;
  source_note: string | null;
  status: string;
}

interface FieldRow {
  request_id: string;
  field_name: string;
  old_value: unknown;
  new_value: unknown;
}

export default function AdminPlaceEditsPage() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [fields, setFields] = useState<FieldRow[]>([]);
  const [patches, setPatches] = useState<Record<string, Record<string, string>>>({});
  const [note, setNote] = useState("");

  async function load() {
    const response = await fetch("/api/admin/edits?status=pending");
    const data = (await response.json()) as {
      requests?: RequestRow[];
      fields?: FieldRow[];
    };
    setRequests(data.requests ?? []);
    setFields(data.fields ?? []);
  }

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/admin/edits?status=pending")
      .then((response) => response.json())
      .then((data: { requests?: RequestRow[]; fields?: FieldRow[] }) => {
        if (cancelled) {
          return;
        }
        setRequests(data.requests ?? []);
        setFields(data.fields ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function act(id: string, action: "approve" | "reject") {
    const fieldPatch = patches[id];
    await fetch("/api/admin/edits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        action,
        publicNote: note || undefined,
        patch: fieldPatch,
      }),
    });
    await load();
  }

  return (
    <div>
      <h1 className="font-heading text-3xl">Predlozi izmena</h1>
      <Input
        className="mt-4 max-w-md"
        placeholder="Javna napomena uz odbijanje"
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <div className="mt-6 space-y-4">
        {requests.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl bg-card p-4 ring-1 ring-foreground/8"
          >
            <p className="text-sm text-muted-foreground">{item.place_key}</p>
            {fields
              .filter((field) => field.request_id === item.id)
              .map((field) => (
                <div key={field.field_name} className="mt-3">
                  <p className="text-sm font-medium">{field.field_name}</p>
                  <p className="text-xs text-muted-foreground">
                    staro: {String(field.old_value ?? "nije poznato")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    novo: {String(field.new_value)}
                  </p>
                  <Input
                    className="mt-1"
                    defaultValue={String(field.new_value ?? "")}
                    onChange={(event) =>
                      setPatches((current) => ({
                        ...current,
                        [item.id]: {
                          ...current[item.id],
                          [field.field_name]: event.target.value,
                        },
                      }))
                    }
                  />
                </div>
              ))}
            {item.source_note ? (
              <p className="mt-2 text-sm">Izvor: {item.source_note}</p>
            ) : null}
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={() => void act(item.id, "approve")}>
                Odobri
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void act(item.id, "approve")}
              >
                Izmeni i odobri
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void act(item.id, "reject")}
              >
                Odbij
              </Button>
            </div>
          </article>
        ))}
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nema izmena na čekanju.</p>
        ) : null}
      </div>
    </div>
  );
}
