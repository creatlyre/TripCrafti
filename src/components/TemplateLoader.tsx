import React, { useState } from 'react';

import type { PackingItem, ChecklistItem } from '@/types';

import { useDictionary } from '@/components/hooks/useDictionary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getTemplatesByFilters, type PackingTemplate } from '@/lib/packingTemplates';

interface TemplateLoaderProps {
  onLoadTemplate: (items: PackingItem[], checklist: ChecklistItem[], templateName: string) => void;
  isLoading?: boolean;
}

const TemplateLoader: React.FC<TemplateLoaderProps> = ({ onLoadTemplate, isLoading = false }) => {
  const dict = useDictionary();
  const tFilters = dict.packing?.templateFilters;
  // const tList = dict.packing?.list; // reserved for future use
  const tCommon = dict.ui?.common;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PackingTemplate | null>(null);
  const [transportFilter, setTransportFilter] = useState<string>('all');
  const [accommodationFilter, setAccommodationFilter] = useState<string>('all');
  const [seasonFilter, setSeasonFilter] = useState<string>('all');

  const filteredTemplates = getTemplatesByFilters(
    transportFilter === 'all' ? undefined : transportFilter || undefined,
    accommodationFilter === 'all' ? undefined : accommodationFilter || undefined,
    seasonFilter === 'all' ? undefined : seasonFilter || undefined
  );

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
      {/* eslint-disable-next-line local-i18n/no-hardcoded-jsx-text */}
      <Button onClick={() => setIsModalOpen(true)} disabled={isLoading} variant="outline" className="w-full">
        📋 {tFilters?.loadTemplate || 'Załaduj szablon'}
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        {/* eslint-disable-next-line local-i18n/no-hardcoded-jsx-text */}
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tFilters?.templatePreview || 'Podgląd szablonu:'}</DialogTitle>
            <DialogDescription>
              {tFilters?.clearToSeeAll || 'Wyczyść filtry aby zobaczyć wszystkie szablony'}
            </DialogDescription>
          </DialogHeader>

          {/* eslint-disable-next-line local-i18n/no-hardcoded-jsx-text */}
          <div className="space-y-6">
            {/* Filters */}
            {/* eslint-disable-next-line local-i18n/no-hardcoded-jsx-text */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div>
                {/* eslint-disable-next-line local-i18n/no-hardcoded-jsx-text */}
                <label className="block text-sm font-medium mb-2">{tFilters?.transport}</label>
                <Select value={transportFilter} onValueChange={setTransportFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={tFilters?.all} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{tFilters?.all}</SelectItem>
                    {tFilters?.transportOptions?.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                {/* eslint-disable-next-line local-i18n/no-hardcoded-jsx-text */}
                <label className="block text-sm font-medium mb-2">{tFilters?.lodging}</label>
                <Select value={accommodationFilter} onValueChange={setAccommodationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={tFilters?.all} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{tFilters?.all}</SelectItem>
                    {tFilters?.lodgingOptions?.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                {/* eslint-disable-next-line local-i18n/no-hardcoded-jsx-text */}
                <label className="block text-sm font-medium mb-2">{tFilters?.season}</label>
                <Select value={seasonFilter} onValueChange={setSeasonFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={tFilters?.all} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{tFilters?.all}</SelectItem>
                    {tFilters?.seasonOptions?.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* eslint-disable-next-line local-i18n/no-hardcoded-jsx-text */}
              <div className="flex items-end">
                <Button onClick={clearFilters} variant="outline" className="w-full">
                  {tFilters?.clearFilters}
                </Button>
              </div>
            </div>

            {/* Templates Grid */}
            {/* eslint-disable-next-line local-i18n/no-hardcoded-jsx-text */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplate?.id === template.id
                      ? 'ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  {/* eslint-disable-next-line local-i18n/no-hardcoded-jsx-text */}
                  <CardHeader className="pb-2">
                    {/* eslint-disable-next-line local-i18n/no-hardcoded-jsx-text */}
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <span className="text-2xl">{template.icon}</span>
                      {template.name}
                    </CardTitle>
                    {/* eslint-disable-next-line local-i18n/no-hardcoded-jsx-text */}
                    <CardDescription className="text-sm">{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* eslint-disable-next-line local-i18n/no-hardcoded-jsx-text */}
                    <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                      <div>
                        <strong>{tFilters?.transport}:</strong> {template.transport.join(', ')}
                      </div>
                      <div>
                        <strong>{tFilters?.lodging}:</strong> {template.accommodation.join(', ')}
                      </div>
                      <div>
                        <strong>{tFilters?.season}:</strong> {template.season.join(', ')}
                      </div>
                      <div>
                        <strong>{tFilters?.items}:</strong> {template.items.length}
                      </div>
                      <div>
                        <strong>{tFilters?.tasks}:</strong> {template.checklist.length}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              // eslint-disable-next-line local-i18n/no-hardcoded-jsx-text
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <p>{tFilters?.noTemplatesMatch}</p>
                <Button onClick={clearFilters} variant="outline" className="mt-2">
                  {tFilters?.clearToSeeAll}
                </Button>
              </div>
            )}

            {/* Preview selected template */}
            {selectedTemplate && (
              // eslint-disable-next-line local-i18n/no-hardcoded-jsx-text
              <div className="border-t pt-4">
                {/* eslint-disable-next-line local-i18n/no-hardcoded-jsx-text */}
                <h4 className="font-medium mb-2">
                  {tFilters?.templatePreview} {selectedTemplate.name}
                </h4>
                {/* eslint-disable-next-line local-i18n/no-hardcoded-jsx-text */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-40 overflow-y-auto text-sm">
                  <div>
                    {/* eslint-disable-next-line local-i18n/no-hardcoded-jsx-text */}
                    <h5 className="font-medium mb-1">
                      {tFilters?.items} ({selectedTemplate.items.length}):
                    </h5>
                    {/* eslint-disable-next-line local-i18n/no-hardcoded-jsx-text */}
                    <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
                      {selectedTemplate.items.slice(0, 10).map((item, index) => (
                        <li key={index}>
                          • {item.name} ({item.qty})
                        </li>
                      ))}
                      {selectedTemplate.items.length > 10 && (
                        <li className="italic">
                          ... {tFilters?.more} ({selectedTemplate.items.length - 10})
                        </li>
                      )}
                    </ul>
                  </div>
                  <div>
                    {/* eslint-disable-next-line local-i18n/no-hardcoded-jsx-text */}
                    <h5 className="font-medium mb-1">
                      {tFilters?.tasks} ({selectedTemplate.checklist.length}):
                    </h5>
                    {/* eslint-disable-next-line local-i18n/no-hardcoded-jsx-text */}
                    <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
                      {selectedTemplate.checklist.slice(0, 8).map((item, index) => (
                        <li key={index}>• {item.task}</li>
                      ))}
                      {selectedTemplate.checklist.length > 8 && (
                        <li className="italic">
                          ... {tFilters?.more} ({selectedTemplate.checklist.length - 8})
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            {/* eslint-disable-next-line local-i18n/no-hardcoded-jsx-text */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button onClick={() => setIsModalOpen(false)} variant="outline">
                {tCommon?.cancel || 'Anuluj'}
              </Button>
              <Button
                onClick={handleConfirmLoad}
                disabled={!selectedTemplate || isLoading}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isLoading ? tCommon?.loading : tFilters?.loadTemplate || 'Załaduj szablon'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TemplateLoader;
