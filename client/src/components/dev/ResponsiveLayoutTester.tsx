import React, { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

// Common device presets
const devicePresets = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12/13', width: 390, height: 844 },
  { name: 'iPhone 12/13 Pro Max', width: 428, height: 926 },
  { name: 'iPad', width: 768, height: 1024 },
  { name: 'iPad Pro', width: 1024, height: 1366 },
  { name: 'Small Laptop', width: 1280, height: 720 },
  { name: 'Laptop', width: 1440, height: 900 },
  { name: 'Desktop', width: 1920, height: 1080 },
];

// Common breakpoints
const breakpoints = [
  { name: 'sm (640px)', width: 640 },
  { name: 'md (768px)', width: 768 },
  { name: 'lg (1024px)', width: 1024 },
  { name: 'xl (1280px)', width: 1280 },
  { name: '2xl (1536px)', width: 1536 },
];

export function ResponsiveLayoutTester() {
  const [width, setWidth] = useState(375);
  const [height, setHeight] = useState(667);
  const [showControls, setShowControls] = useState(true);
  const [showHighlight, setShowHighlight] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');

  // URL handling
  useEffect(() => {
    // Default to current URL if none specified
    if (!customUrl) {
      setCustomUrl(window.location.pathname);
      setCurrentUrl(window.location.pathname);
    }
  }, []);

  // Handle preset selection
  const handlePresetChange = (value: string) => {
    const preset = devicePresets.find(device => device.name === value);
    if (preset) {
      setWidth(preset.width);
      setHeight(preset.height);
    }
  };

  // Handle breakpoint selection
  const handleBreakpointChange = (value: string) => {
    const breakpoint = breakpoints.find(bp => bp.name === value);
    if (breakpoint) {
      setWidth(breakpoint.width);
    }
  };

  // Navigate to URL
  const navigateToUrl = () => {
    setCurrentUrl(customUrl);
  };

  // Toggle panels
  const toggleControls = () => {
    setShowControls(!showControls);
  };

  // Reset to defaults
  const resetSize = () => {
    setWidth(375);
    setHeight(667);
  };

  // Apply grid overlay styles
  const gridStyles = showGrid
    ? {
        backgroundImage: 'linear-gradient(to right, rgba(0, 0, 0, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 1px, transparent 1px)',
        backgroundSize: '16px 16px'
      }
    : {};

  // Element highlighting styles
  const highlightStyles = showHighlight
    ? `
      <style>
        .responsive-frame-content * {
          outline: 1px solid rgba(0, 100, 255, 0.2) !important;
        }
        .responsive-frame-content *:hover {
          outline: 2px solid rgba(255, 0, 0, 0.5) !important;
        }
      </style>
    `
    : '';

  return (
    <div className="fixed inset-0 bg-background flex flex-col z-50">
      {/* Control panel */}
      <div className="bg-card border-b p-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleControls}
          >
            {showControls ? 'Hide Controls' : 'Show Controls'}
          </Button>
          <div className="text-sm">
            {width} × {height}px
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => window.location.href = currentUrl}
          >
            Exit Tester
          </Button>
        </div>
      </div>

      {/* Controls panel */}
      {showControls && (
        <div className="bg-card border-b p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Device presets */}
            <div>
              <Label htmlFor="device-preset">Device Preset</Label>
              <Select onValueChange={handlePresetChange}>
                <SelectTrigger id="device-preset">
                  <SelectValue placeholder="Select device" />
                </SelectTrigger>
                <SelectContent>
                  {devicePresets.map((device) => (
                    <SelectItem key={device.name} value={device.name}>
                      {device.name} ({device.width}×{device.height})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Breakpoint selector */}
            <div>
              <Label htmlFor="breakpoint">Breakpoint</Label>
              <Select onValueChange={handleBreakpointChange}>
                <SelectTrigger id="breakpoint">
                  <SelectValue placeholder="Select breakpoint" />
                </SelectTrigger>
                <SelectContent>
                  {breakpoints.map((breakpoint) => (
                    <SelectItem key={breakpoint.name} value={breakpoint.name}>
                      {breakpoint.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* URL navigation */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="url-input">URL Path</Label>
              <div className="flex gap-2">
                <input
                  id="url-input"
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="flex-1 px-3 py-1 border rounded-md"
                  placeholder="/path/to/page"
                />
                <Button size="sm" onClick={navigateToUrl}>Go</Button>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Accordion type="single" collapsible>
              <AccordionItem value="advanced">
                <AccordionTrigger>Advanced Options</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {/* Width slider */}
                    <div>
                      <Label htmlFor="width-slider">Width: {width}px</Label>
                      <Slider
                        id="width-slider"
                        value={[width]}
                        min={320}
                        max={1920}
                        step={1}
                        onValueChange={(values) => setWidth(values[0])}
                      />
                    </div>

                    {/* Height slider */}
                    <div>
                      <Label htmlFor="height-slider">Height: {height}px</Label>
                      <Slider
                        id="height-slider"
                        value={[height]}
                        min={480}
                        max={1080}
                        step={1}
                        onValueChange={(values) => setHeight(values[0])}
                      />
                    </div>

                    {/* Toggles */}
                    <div className="flex items-center space-x-8">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="grid-toggle"
                          checked={showGrid}
                          onCheckedChange={setShowGrid}
                        />
                        <Label htmlFor="grid-toggle">Show Grid</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="highlight-toggle"
                          checked={showHighlight}
                          onCheckedChange={setShowHighlight}
                        />
                        <Label htmlFor="highlight-toggle">Highlight Elements</Label>
                      </div>
                    </div>

                    {/* Reset button */}
                    <div className="flex items-center">
                      <Button variant="outline" onClick={resetSize}>
                        Reset Size
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      )}

      {/* Iframe container */}
      <div className="flex-1 bg-zinc-200 overflow-auto p-4 flex items-center justify-center">
        <div 
          className="responsive-frame bg-white shadow-lg rounded"
          style={{ 
            width: `${width}px`, 
            height: `${height}px`,
            transition: 'width 0.3s, height 0.3s',
            overflow: 'hidden',
            ...gridStyles
          }}
        >
          <iframe
            src={currentUrl}
            width="100%"
            height="100%"
            className="responsive-frame-content"
            style={{ border: 'none' }}
            sandbox="allow-same-origin allow-forms allow-scripts"
            srcDoc={`
              <!DOCTYPE html>
              <html>
                <head>
                  <base href="${window.location.origin}" />
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  ${highlightStyles}
                </head>
                <body>
                  <script>
                    window.location.href = "${currentUrl}";
                  </script>
                </body>
              </html>
            `}
          />
        </div>
      </div>
    </div>
  );
}