import React, { useState, useRef } from 'react';
import { KnowledgeData, CandidateScore } from '../types/game';
import { DatasetPresetId } from '../services/twentyQuestions';
import { Database, Download, Upload, RotateCcw, X, Search, CheckCircle2, ChevronRight, Layers, Play } from 'lucide-react';

interface KnowledgeInspectorProps {
  knowledge: KnowledgeData;
  candidateRanking: CandidateScore[];
  currentDatasetId: DatasetPresetId;
  onSelectDataset: (id: DatasetPresetId) => void;
  onClose: () => void;
  onResetFactory: () => void;
  onImportKnowledge: (data: KnowledgeData) => void;
}

export const KnowledgeInspector: React.FC<KnowledgeInspectorProps> = ({
  knowledge,
  candidateRanking,
  currentDatasetId,
  onSelectDataset,
  onClose,
  onResetFactory,
  onImportKnowledge,
}) => {
  const [activeTab, setActiveTab] = useState<'objects' | 'questions' | 'ranking' | 'datasets'>('datasets');
  const [search, setSearch] = useState('');
  const [selectedObjName, setSelectedObjName] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(knowledge, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'knowledge.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.objects && parsed.questions) {
          onImportKnowledge(parsed);
          alert('Knowledge database successfully imported!');
        } else {
          alert('Invalid format: File must contain objects and questions.');
        }
      } catch {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // Re-fetch direct raw CSV from earthtojake/20q github repository
  const handleFetchGithubCsv = async (fileName: 'big' | 'medium' | 'small' | 'micro') => {
    setIsSyncing(fileName);
    try {
      const url = `https://raw.githubusercontent.com/earthtojake/20q/master/data/${fileName}.csv`;
      const res = await fetch(url);
      const text = await res.text();
      const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
      const headers = lines[0].split(',').map(h => h.trim());
      const rawQuestions = headers.slice(1);

      const qObj: Record<string, string> = {};
      rawQuestions.forEach((q) => {
        qObj[q] = q.charAt(0).toUpperCase() + q.slice(1);
      });

      const newObjects = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim());
        const name = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
        const attrs: Record<string, number> = {};
        for (let j = 0; j < rawQuestions.length; j++) {
          attrs[rawQuestions[j]] = parseFloat(parts[j + 1]) || 0;
        }
        newObjects.push({
          name,
          category: 'Animal',
          attributes: attrs
        });
      }

      onImportKnowledge({
        questions: qObj,
        objects: newObjects
      });

      alert(`Fetched and stored ${fileName}.csv (${newObjects.length} objects, ${rawQuestions.length} questions)!`);
    } catch {
      alert(`Failed to fetch ${fileName}.csv from GitHub.`);
    } finally {
      setIsSyncing(null);
    }
  };

  const filteredObjects = knowledge.objects.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedObject = knowledge.objects.find((o) => o.name === selectedObjName);

  const datasetList = [
    {
      id: 'master' as DatasetPresetId,
      name: 'Master Merged Knowledge',
      desc: 'All 100+ animals from earthtojake datasets PLUS everyday objects (Nail Polish, Glove, Smartphone, Guitar, Airplane, etc.)',
      objectsCount: '120+',
      questionsCount: '42',
      badge: 'RECOMMENDED',
    },
    {
      id: 'big' as DatasetPresetId,
      name: 'earthtojake/20q big.csv',
      desc: 'Original 100 zoo animals dataset with 28 diagnostic animal questions (aardvark, antelope, bear, penguin, elephant, etc.)',
      objectsCount: '100',
      questionsCount: '28',
      url: 'https://github.com/earthtojake/20q/blob/master/data/big.csv',
    },
    {
      id: 'medium' as DatasetPresetId,
      name: 'earthtojake/20q medium.csv',
      desc: '13 animals including platypus, starfish, giraffe with 15 questions including "catsize?", "brown?", "bigger than a car?"',
      objectsCount: '13',
      questionsCount: '15',
      url: 'https://github.com/earthtojake/20q/blob/master/data/medium.csv',
    },
    {
      id: 'small' as DatasetPresetId,
      name: 'earthtojake/20q small.csv',
      desc: '12 animal species with 6 questions: warm-blooded, can it fly, vertebrate, endangered, live in groups, has hair',
      objectsCount: '12',
      questionsCount: '6',
      url: 'https://github.com/earthtojake/20q/blob/master/data/small.csv',
    },
    {
      id: 'micro' as DatasetPresetId,
      name: 'earthtojake/20q micro.csv',
      desc: '5 animal prototypes (giraffe, seal, chicken, penguin, elephant) with 5 distinct questions including "does it have a trunk?"',
      objectsCount: '5',
      questionsCount: '5',
      url: 'https://github.com/earthtojake/20q/blob/master/data/micro.csv',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-zinc-900 border border-zinc-700/80 rounded-3xl shadow-2xl overflow-hidden text-zinc-100">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-retro-brand text-sm md:text-base font-bold tracking-wider text-purple-200">
                64-BIT EEPROM MEMORY BROWSER
              </h2>
              <div className="flex items-center gap-2 text-xs text-zinc-400 font-tech">
                <span className="text-emerald-400 font-semibold">{knowledge.objects.length} Objects</span>
                <span>·</span>
                <span>{Object.keys(knowledge.questions).length} Questions</span>
                <span>·</span>
                <span className="text-amber-300 font-bold uppercase">Active: {currentDatasetId}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              title="Download knowledge.json"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-tech font-bold uppercase transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export JSON</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Upload knowledge.json"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-tech font-bold uppercase transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import JSON</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-5 border-b border-zinc-800 bg-zinc-950/40 text-xs font-tech">
          <button
            onClick={() => setActiveTab('datasets')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold uppercase transition-colors cursor-pointer ${
              activeTab === 'datasets'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>EarthToJake Datasets ({datasetList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('objects')}
            className={`py-3 px-4 border-b-2 font-bold uppercase transition-colors cursor-pointer ${
              activeTab === 'objects'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Objects in Memory ({knowledge.objects.length})
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`py-3 px-4 border-b-2 font-bold uppercase transition-colors cursor-pointer ${
              activeTab === 'questions'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Questions Dictionary ({Object.keys(knowledge.questions).length})
          </button>
          <button
            onClick={() => setActiveTab('ranking')}
            className={`py-3 px-4 border-b-2 font-bold uppercase transition-colors cursor-pointer ${
              activeTab === 'ranking'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Live Neural Probability
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* TAB: DATASETS */}
          {activeTab === 'datasets' && (
            <div className="space-y-4">
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4">
                <h3 className="font-tech text-sm font-bold text-emerald-300 uppercase tracking-wider mb-1 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Official EarthToJake 20Q Dataset Hub
                </h3>
                <p className="text-xs text-zinc-300 font-tech">
                  All 4 datasets from <span className="text-white font-mono">github.com/earthtojake/20q</span> (big.csv, medium.csv, small.csv, micro.csv) are fully loaded into memory. Click [ACTIVATE] to load any dataset into the 20Q device right now!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {datasetList.map((ds) => {
                  const isActive = currentDatasetId === ds.id;
                  return (
                    <div
                      key={ds.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        isActive
                          ? 'bg-zinc-800/90 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                          : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="font-tech text-sm font-bold text-white flex items-center gap-2">
                            {ds.name}
                            {isActive && (
                              <span className="text-[10px] bg-emerald-500 text-black px-2 py-0.5 rounded font-black">
                                ACTIVE
                              </span>
                            )}
                            {ds.badge && (
                              <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1.5 py-0.5 rounded">
                                {ds.badge}
                              </span>
                            )}
                          </h4>
                          <span className="font-mono text-xs text-emerald-400">
                            {ds.objectsCount} objs · {ds.questionsCount} qs
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 font-tech leading-relaxed mb-3">
                          {ds.desc}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/60">
                        <button
                          onClick={() => {
                            onSelectDataset(ds.id);
                            onClose();
                          }}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-tech font-bold uppercase transition-all cursor-pointer ${
                            isActive
                              ? 'bg-emerald-500 text-black shadow'
                              : 'bg-zinc-800 hover:bg-emerald-600 hover:text-black text-zinc-200'
                          }`}
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{isActive ? 'Playing with this dataset' : 'Activate & Play'}</span>
                        </button>

                        {ds.id !== 'master' && (
                          <button
                            onClick={() => handleFetchGithubCsv(ds.id as 'big' | 'medium' | 'small' | 'micro')}
                            disabled={Boolean(isSyncing)}
                            title="Re-fetch fresh CSV directly from GitHub"
                            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs cursor-pointer"
                          >
                            <RotateCcw className={`w-3.5 h-3.5 ${isSyncing === ds.id ? 'animate-spin text-emerald-400' : ''}`} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: OBJECTS */}
          {activeTab === 'objects' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search objects..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="max-h-[50vh] overflow-y-auto space-y-1 pr-1 font-tech">
                  {filteredObjects.map((obj) => (
                    <button
                      key={obj.name}
                      onClick={() => setSelectedObjName(obj.name)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                        selectedObjName === obj.name
                          ? 'bg-purple-900/40 text-purple-200 border border-purple-500/50'
                          : 'bg-zinc-950/50 hover:bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      <span className="font-medium">{obj.name}</span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4">
                {selectedObject ? (
                  <div>
                    <h3 className="text-base font-bold text-white mb-2 font-tech flex items-center justify-between">
                      <span>{selectedObject.name}</span>
                      <span className="text-xs text-purple-400 uppercase font-mono">{selectedObject.category || 'Item'}</span>
                    </h3>
                    <div className="max-h-[48vh] overflow-y-auto space-y-1 font-mono text-[11px]">
                      {Object.entries(selectedObject.attributes).map(([k, val]) => (
                        <div key={k} className="flex items-center justify-between py-1 border-b border-zinc-800/40">
                          <span className="text-zinc-400">{knowledge.questions[k] || k}</span>
                          <span className={`font-bold ${val >= 0.7 ? 'text-emerald-400' : val <= 0.3 ? 'text-rose-400' : 'text-amber-400'}`}>
                            {val === 1 ? 'YES (1.0)' : val === 0 ? 'NO (0.0)' : 'MAYBE (0.5)'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-zinc-500 font-tech text-xs">
                    Select an object from the list to inspect attributes
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: QUESTIONS */}
          {activeTab === 'questions' && (
            <div className="space-y-2">
              <div className="font-tech text-xs text-zinc-400 mb-2">
                All questions in memory with their internal keys:
              </div>
              <div className="max-h-[55vh] overflow-y-auto space-y-1.5 font-tech">
                {Object.entries(knowledge.questions).map(([key, text], idx) => (
                  <div key={key} className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs text-purple-400 font-mono mr-2">Q{idx + 1} [{key}]</span>
                      <span className="text-sm font-medium text-white">{text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: LIVE RANKING */}
          {activeTab === 'ranking' && (
            <div className="space-y-2">
              <div className="font-tech text-xs text-zinc-400 mb-2">
                Current candidate probabilities based on the answers given in this round:
              </div>
              <div className="max-h-[55vh] overflow-y-auto space-y-1.5 font-tech">
                {candidateRanking.slice(0, 30).map((cand, idx) => (
                  <div key={cand.name} className="p-2.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-zinc-500 w-6">#{idx + 1}</span>
                      <span className="font-medium text-sm text-white">{cand.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-zinc-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${cand.matchPercentage}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs font-bold text-emerald-400 w-12 text-right">
                        {cand.matchPercentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950/70 flex items-center justify-between text-xs font-tech">
          <button
            onClick={onResetFactory}
            className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Factory Default</span>
          </button>
          <span className="text-zinc-500">64-BIT NEURAL SYSTEM</span>
        </div>
      </div>
    </div>
  );
};
