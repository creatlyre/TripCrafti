import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PACKING_TEMPLATES, getTemplatesByFilters, type PackingTemplate, localizeTemplate } from '@/lib/packingTemplates';
import type { Lang } from '@/lib/i18n';
import { getDictionary } from '@/lib/i18n';
import type { PackingItem, ChecklistItem } from '@/types';

interface TemplateLoaderProps {
  onLoadTemplate: (items: PackingItem[], checklist: ChecklistItem[], templateName: string) => void;
  isLoading?: boolean;
  lang?: Lang;
}

const TemplateLoader: React.FC<TemplateLoaderProps> = ({ onLoadTemplate, isLoading = false, lang = 'pl' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PackingTemplate | null>(null);
  const dict = getDictionary(lang).packing?.templateLoader;
  const [transportFilter, setTransportFilter] = useState<string>('all');
  const [accommodationFilter, setAccommodationFilter] = useState<string>('all');
  const [seasonFilter, setSeasonFilter] = useState<string>('all');

  const filteredTemplates = getTemplatesByFilters(
    transportFilter === 'all' ? undefined : transportFilter || undefined,
    accommodationFilter === 'all' ? undefined : accommodationFilter || undefined,
    seasonFilter === 'all' ? undefined : seasonFilter || undefined
  );

  const localizedTemplates = filteredTemplates.map(t => localizeTemplate(t, lang));

  const handleLoadTemplate = (template: PackingTemplate) => {
    // Transform template items to PackingItem format with generated IDs
    const items: PackingItem[] = template.items.map((item, index) => ({
      ...item,
      id: Date.now() + index, // Simple ID generation
      packed: false,
    }));

    // Transform template checklist to ChecklistItem format
    const checklist: ChecklistItem[] = template.checklist.map((item, index) => ({
      ...item,
      id: Date.now() + 1000 + index, // Offset to avoid ID collision
    }));

    onLoadTemplate(items, checklist, template.name);
    setIsModalOpen(false);
    setSelectedTemplate(null);
  };

  const handleConfirmLoad = () => {
    if (selectedTemplate) {
      handleLoadTemplate(selectedTemplate);
    }
  };

  const clearFilters = () => {
    setTransportFilter('all');
    setAccommodationFilter('all');
    setSeasonFilter('all');
  };

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        disabled={isLoading}
        variant="outline"
        className="w-full"
      >
        📋 {dict?.open}
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dict?.title}</DialogTitle>
            <DialogDescription>
              {dict?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div>
                <label className="block text-sm font-medium mb-2">{dict?.filters.transport}</label>
                <Select value={transportFilter} onValueChange={setTransportFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={dict?.filters.all} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{dict?.filters.all}</SelectItem>
                    <SelectItem value="Samolot">Samolot</SelectItem>
                    <SelectItem value="Samochód">Samochód</SelectItem>
                    <SelectItem value="Pociąg">Pociąg</SelectItem>
                    <SelectItem value="Autobus">Autobus</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{dict?.filters.lodging}</label>
                <Select value={accommodationFilter} onValueChange={setAccommodationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={dict?.filters.all} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{dict?.filters.all}</SelectItem>
                    <SelectItem value="Hotel">Hotel</SelectItem>
                    <SelectItem value="Apartament">Apartament</SelectItem>
                    <SelectItem value="Pensjonat">Pensjonat</SelectItem>
                    <SelectItem value="Schronisko">Schronisko</SelectItem>
                    <SelectItem value="Kemping">Kemping</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{dict?.filters.season}</label>
                <Select value={seasonFilter} onValueChange={setSeasonFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={dict?.filters.all} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{dict?.filters.all}</SelectItem>
                    <SelectItem value="Wiosna">Wiosna</SelectItem>
                    <SelectItem value="Lato">Lato</SelectItem>
                    <SelectItem value="Jesień">Jesień</SelectItem>
                    <SelectItem value="Zima">Zima</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={clearFilters} variant="outline" className="w-full">
                  {dict?.filters.clear}
                </Button>
              </div>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {localizedTemplates.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplate?.id === template.id
                      ? 'ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  onClick={() => setSelectedTemplate(filteredTemplates.find(t=>t.id===template.id) || null)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <span className="text-2xl">{template.icon}</span>
                      {template.name}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                      <div>
                        <strong>{dict?.filters.transport}:</strong> {template.transport.join(', ')}
                      </div>
                      <div>
                        <strong>{dict?.filters.lodging}:</strong> {template.accommodation.join(', ')}
                      </div>
                      <div>
                        <strong>{dict?.filters.season}:</strong> {template.season.join(', ')}
                      </div>
                      <div>
                        <strong>{dict?.stats.items}</strong> {template.items.length}
                      </div>
                      <div>
                        <strong>{dict?.stats.tasks}</strong> {template.checklist.length}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <p>{dict?.none.title}</p>
                <Button onClick={clearFilters} variant="outline" className="mt-2">
                  {dict?.none.reset}
                </Button>
              </div>
            )}

            {/* Preview selected template */}
            {selectedTemplate && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">{getDictionary(lang).packing?.sections.preview} {localizeTemplate(selectedTemplate, lang).name}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-40 overflow-y-auto text-sm">
                  <div>
                    <h5 className="font-medium mb-1">{dict?.preview.items} ({selectedTemplate.items.length}):</h5>
                    <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
                      {selectedTemplate.items.slice(0, 10).map((item, index) => (
                        <li key={index}>• {item.name} ({item.qty})</li>
                      ))}
                      {selectedTemplate.items.length > 10 && (
                        <li className="italic">{dict?.preview.more && dict.preview.more !== 'więcej' ? `... ${dict.preview.more}` : `... ${dict?.preview.more ? 'i' : ''}`} {selectedTemplate.items.length - 10} {dict?.preview.more}</li>
                      )}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-1">{dict?.preview.tasks} ({selectedTemplate.checklist.length}):</h5>
                    <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
                      {selectedTemplate.checklist.slice(0, 8).map((item, index) => (
                        <li key={index}>• {item.task}</li>
                      ))}
                      {selectedTemplate.checklist.length > 8 && (
                        <li className="italic">{dict?.preview.more && dict.preview.more !== 'więcej' ? `... ${dict.preview.more}` : `... ${dict?.preview.more ? 'i' : ''}`} {selectedTemplate.checklist.length - 8} {dict?.preview.more}</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                onClick={() => setIsModalOpen(false)}
                variant="outline"
              >
                {dict?.actions.cancel}
              </Button>
              <Button
                onClick={handleConfirmLoad}
                disabled={!selectedTemplate || isLoading}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isLoading ? dict?.actions.loading : dict?.actions.load}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TemplateLoader;