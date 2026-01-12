'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseLdmMessage, formatLdmData, isValidLdmData, type LdmData } from '@/lib/parsers/ldm-parser';

interface LdmMessageInputProps {
  onDataParsed: (data: LdmData) => void;
  phase: 'arrival' | 'departure';
}

export function LdmMessageInput({ onDataParsed, phase }: LdmMessageInputProps) {
  const [ldmText, setLdmText] = useState('');
  const [parsedData, setParsedData] = useState<LdmData | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setLdmText(e.target.value);
    setError('');
    setParsedData(null);
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
      setError('Molimo uploadujte .txt fajl');
      return;
    }

    try {
      // Čitaj fajl kao text sa različitim encodingima
      const arrayBuffer = await file.arrayBuffer();
      const decoder = new TextDecoder('utf-8'); // Možemo koristiti i 'windows-1252' ako treba
      let text = decoder.decode(arrayBuffer);

      // Ukloni BOM ako postoji
      if (text.charCodeAt(0) === 0xFEFF) {
        text = text.substring(1);
      }

      // Ukloni dodatne whitespace karaktere
      text = text.trim();

      console.log('File upload - Raw text length:', text.length);
      console.log('File upload - First 100 chars:', text.substring(0, 100));

      setLdmText(text);
      setError('');
      setParsedData(null);
    } catch (err) {
      setError('Greška pri čitanju fajla');
      console.error('File upload error:', err);
    }
  };

  const handleParse = () => {
    if (!ldmText.trim()) {
      setError('Molimo unesite LDM poruku');
      return;
    }

    try {
      console.log('Parsing LDM message, length:', ldmText.length);
      console.log('LDM message preview:', ldmText.substring(0, 200));

      const data = parseLdmMessage(ldmText);
      console.log('Parsed data:', data);
      setParsedData(data);

      if (!isValidLdmData(data)) {
        console.log('Validation failed - missing required fields');
        console.log('Flight number:', data.flightNumber);
        console.log('Registration:', data.registration);
        console.log('Total passengers:', data.totalPassengers);
        console.log('Baggage weight:', data.baggageWeight);

        // Prikazi upozorenje ali omogući primjenu podataka
        const missingFields = [];
        if (!data.flightNumber && !data.registration) missingFields.push('broj leta/registracija');
        if (!data.totalPassengers && !data.male && !data.female) missingFields.push('broj putnika');

        setError(`LDM poruka ne sadrži sve podatke (nedostaje: ${missingFields.join(', ')}). Možete primijeniti dostupne podatke.`);
      } else {
        setError('');
      }
    } catch (err) {
      setError('Greška pri parsiranju LDM poruke');
      console.error('Parse error:', err);
    }
  };

  const handleApplyData = () => {
    if (parsedData) {
      // Primijeni podatke čak i ako nisu kompletni
      onDataParsed(parsedData);
      setIsExpanded(false);
      setLdmText('');
      setParsedData(null);
      setError('');
    }
  };

  const handleClear = () => {
    setLdmText('');
    setParsedData(null);
    setError('');
  };

  const phaseLabel = phase === 'arrival' ? 'Dolazak' : 'Odlazak';

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 shadow-sm">
      <div
        className={`flex items-center justify-between mb-3 ${
          !isExpanded ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
        }`}
        onClick={() => !isExpanded && setIsExpanded(true)}
      >
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-semibold text-blue-900">
            Upload LDM poruke ({phaseLabel})
          </h3>
          {!isExpanded && (
            <span className="text-xs text-blue-600 font-medium">(kliknite za otvaranje)</span>
          )}
        </div>
        {isExpanded && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(false);
            }}
            className="text-xs"
          >
            Sakrij
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Textarea za paste */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Zalijepite LDM poruku ili uploadujte .txt fajl
            </label>
            <textarea
              value={ldmText}
              onChange={handleTextChange}
              placeholder={`Primjer LDM poruke:\nLDM\nW64241/12.9HWNL.239Y.2/5\n-MST.128/70/19/9.T1051.1/0.2/0.3/1051.4/0.5/0.PAX/217.PAD/0/0\nSI\nB/70/1051`}
              rows={6}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>

          {/* File upload */}
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload .txt fajl
            </Button>
            <Button
              type="button"
              onClick={handleParse}
              disabled={!ldmText.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Parsiraj podatke
            </Button>
            {ldmText && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Očisti
              </Button>
            )}
          </div>

          {/* Error display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Parsed data display */}
          {parsedData && (
            <div className={`border rounded-lg p-4 space-y-3 ${
              isValidLdmData(parsedData)
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-start gap-2">
                <CheckCircle2 className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                  isValidLdmData(parsedData) ? 'text-emerald-600' : 'text-yellow-600'
                }`} />
                <div className="flex-1">
                  <p className={`text-sm font-semibold mb-2 ${
                    isValidLdmData(parsedData) ? 'text-emerald-900' : 'text-yellow-900'
                  }`}>
                    {isValidLdmData(parsedData)
                      ? 'LDM poruka uspješno parsirana:'
                      : 'LDM poruka parcijalno parsirana (neki podaci nedostaju):'}
                  </p>
                  <div className={`grid grid-cols-2 gap-2 text-sm ${
                    isValidLdmData(parsedData) ? 'text-emerald-800' : 'text-yellow-800'
                  }`}>
                    {parsedData.flightNumber && (
                      <div>
                        <span className="font-medium">Broj leta:</span> {parsedData.flightNumber}
                      </div>
                    )}
                    {parsedData.registration && (
                      <div>
                        <span className="font-medium">Registracija:</span> {parsedData.registration}
                      </div>
                    )}
                    {parsedData.capacity && (
                      <div>
                        <span className="font-medium">Kapacitet:</span> {parsedData.capacity}
                      </div>
                    )}
                    {parsedData.totalPassengers !== null && (
                      <div>
                        <span className="font-medium">Ukupno putnika:</span> {parsedData.totalPassengers}
                      </div>
                    )}
                    {parsedData.male !== null && (
                      <div>
                        <span className="font-medium">Muški:</span> {parsedData.male}
                      </div>
                    )}
                    {parsedData.female !== null && (
                      <div>
                        <span className="font-medium">Ženski:</span> {parsedData.female}
                      </div>
                    )}
                    {parsedData.children !== null && (
                      <div>
                        <span className="font-medium">Djeca:</span> {parsedData.children}
                      </div>
                    )}
                    {parsedData.infants !== null && (
                      <div>
                        <span className="font-medium">Bebe:</span> {parsedData.infants}
                      </div>
                    )}
                    {parsedData.baggageCount !== null && (
                      <div>
                        <span className="font-medium">Broj prtljaga:</span> {parsedData.baggageCount}
                      </div>
                    )}
                    {parsedData.baggageWeight !== null && (
                      <div>
                        <span className="font-medium">Težina prtljaga:</span> {parsedData.baggageWeight} kg
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Button
                type="button"
                onClick={handleApplyData}
                className={`w-full text-white ${
                  isValidLdmData(parsedData)
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                Primijeni dostupne podatke na formu
              </Button>
            </div>
          )}

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Napomena:</strong> LDM poruka će automatski popuniti dostupna polja. Polja koja nisu dio LDM poruke ostaju prazna za ručni unos.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
