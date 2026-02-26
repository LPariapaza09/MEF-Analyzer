import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  User, 
  Link as LinkIcon, 
  Calendar, 
  History, 
  TrendingUp, 
  ArrowUp, 
  ArrowDown, 
  Table as TableIcon, 
  Search, 
  ArrowUpDown,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface ConceptoData {
  concepto: string;
  montoAnterior: number;
  montoActual: number;
  variacionS: number;
  variacionPorcentaje: number;
}

interface ApiResponse {
  yearActual: number;
  yearAnterior: number;
  data: ConceptoData[];
}

export default function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof ConceptoData; direction: 'asc' | 'desc' } | null>({
    key: 'variacionS',
    direction: 'desc'
  });

  const handleEjecutar = async () => {
    if (!url) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/comparar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar la solicitud');
      }
      
      setApiData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: keyof ConceptoData) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedData = useMemo(() => {
    if (!apiData) return [];
    
    let result = [...apiData.data];
    
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(item => item.concepto.toLowerCase().includes(lowerSearch));
    }
    
    if (sortConfig) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return result;
  }, [apiData, searchTerm, sortConfig]);

  const totalAnterior = apiData?.data.reduce((sum, item) => sum + item.montoAnterior, 0) || 0;
  const totalActual = apiData?.data.reduce((sum, item) => sum + item.montoActual, 0) || 0;
  const totalVariacionS = totalActual - totalAnterior;
  const totalVariacionPorcentaje = totalAnterior !== 0 ? Number((((totalActual / totalAnterior) * 100) - 100).toFixed(1)) : 0;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-PE').format(num).replace(/,/g, ' ');
  };

  const formatVariacion = (num: number) => {
    const formatted = formatNumber(Math.abs(num));
    return num > 0 ? `+${formatted}` : num < 0 ? `-${formatted}` : '0';
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen">
      {/* Top Navigation Bar */}
      <header className="bg-white dark:bg-slate-900 border-b border-primary/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-white p-1 rounded-lg flex items-center justify-center">
                <img src="https://www.mef.gob.pe/contenidos/inv_publica/images/logos_seguimiento/logo_economia.jpg" alt="MEF Logo" className="h-8 object-contain" referrerPolicy="no-referrer" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-primary dark:text-white">MEF Data Analyzer</h1>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 text-slate-500 hover:bg-primary/5 rounded-full transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/20">
                <User className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white">Comparación presupuestal interanual</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Comparación basado en las información de Consulta Amigable del MEF</p>
        </div>

        {/* Search / Input Section */}
        <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-primary/5 p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            <div className="lg:col-span-12">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                URL de Consulta (MEF Transparencia Económica)
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-grow">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-3 bg-background-light dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400 outline-none" 
                    placeholder="Pegue aquí el enlace del portal de transparencia..." 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEjecutar()}
                  />
                </div>
                <button 
                  onClick={handleEjecutar}
                  disabled={loading || !url}
                  className="px-8 py-3 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-bold rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 min-w-[140px]"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ejecutar'}
                </button>
              </div>
              {error && (
                <div className="mt-4 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-rose-800 dark:text-rose-300">Error al procesar la consulta</h4>
                    <p className="text-sm text-rose-600 dark:text-rose-400 mt-1">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {apiData && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-primary/5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                    Devengado Actual ({apiData.yearActual})
                  </span>
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">S/ {formatNumber(totalActual)}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-primary/5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                    Devengado Anterior ({apiData.yearAnterior})
                  </span>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <History className="w-5 h-5 text-slate-600" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">S/ {formatNumber(totalAnterior)}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-primary/5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                    Variación Total
                  </span>
                  <div className={`p-2 rounded-lg ${totalVariacionS >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'}`}>
                    <TrendingUp className={`w-5 h-5 ${totalVariacionS >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-3xl font-black ${totalVariacionS >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {totalVariacionS > 0 ? '+' : ''}S/ {formatNumber(totalVariacionS)}
                  </span>
                  <div className={`flex items-center px-2 py-0.5 rounded text-sm font-bold ${
                    totalVariacionPorcentaje >= 0 
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' 
                      : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                  }`}>
                    {totalVariacionPorcentaje >= 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                    {Math.abs(totalVariacionPorcentaje).toLocaleString('es-PE')}%
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-primary/5 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Variación Absoluta (Millones S/)</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredAndSortedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="concepto" hide />
                      <YAxis tickFormatter={(value) => formatNumber(value)} />
                      <Tooltip 
                        formatter={(value: number) => [`S/ ${formatNumber(value)}`, 'Variación S/']}
                        labelFormatter={(label) => `Concepto: ${label}`}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="variacionS" radius={[4, 4, 0, 0]}>
                        {filteredAndSortedData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.variacionS >= 0 ? '#059669' : '#e11d48'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-primary/5 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Variación Porcentual (%)</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredAndSortedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="concepto" hide />
                      <YAxis tickFormatter={(value) => `${value}%`} />
                      <Tooltip 
                        formatter={(value: number) => [`${value}%`, 'Variación %']}
                        labelFormatter={(label) => `Concepto: ${label}`}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="variacionPorcentaje" radius={[4, 4, 0, 0]}>
                        {filteredAndSortedData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.variacionPorcentaje >= 0 ? '#059669' : '#e11d48'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Data Table Section */}
            <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-primary/5 overflow-hidden">
              <div className="p-6 border-b border-primary/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TableIcon className="w-5 h-5" />
                  Detalle por Concepto Presupuestal
                </h3>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-2 bg-background-light dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
                    placeholder="Filtrar por concepto..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50">
                      <th 
                        className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-primary transition-colors text-center"
                        onClick={() => handleSort('concepto')}
                      >
                        Concepto <ArrowUpDown className="w-3 h-3 inline-block align-middle ml-1" />
                      </th>
                      <th 
                        className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center cursor-pointer hover:text-primary transition-colors"
                        onClick={() => handleSort('montoAnterior')}
                      >
                        DEV_{apiData.yearAnterior} <br/><span className="lowercase text-[10px]">(Millones de S/)</span> <ArrowUpDown className="w-3 h-3 inline-block align-middle ml-1" />
                      </th>
                      <th 
                        className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center cursor-pointer hover:text-primary transition-colors"
                        onClick={() => handleSort('montoActual')}
                      >
                        DEV_{apiData.yearActual} <br/><span className="lowercase text-[10px]">(Millones de S/)</span> <ArrowUpDown className="w-3 h-3 inline-block align-middle ml-1" />
                      </th>
                      <th 
                        className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center cursor-pointer hover:text-primary transition-colors"
                        onClick={() => handleSort('variacionS')}
                      >
                        Variación (S/)  <ArrowUpDown className="w-3 h-3 inline-block align-middle ml-1" />
                      </th>
                      <th 
                        className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center cursor-pointer hover:text-primary transition-colors"
                        onClick={() => handleSort('variacionPorcentaje')}
                      >
                        Variación (%) <ArrowUpDown className="w-3 h-3 inline-block align-middle ml-1" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5">
                    {filteredAndSortedData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-primary/5 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">{item.concepto}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-right pr-2">{formatNumber(item.montoAnterior)}</td>
                        <td className="px-6 py-4 text-slate-900 dark:text-white font-semibold text-right pr-2">{formatNumber(item.montoActual)}</td>
                        <td className={`px-6 py-4 font-medium text-right pr-2 ${item.variacionS > 0 ? 'text-emerald-600' : item.variacionS < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                          {formatVariacion(item.variacionS)}
                        </td>
                        <td className="px-6 py-4 text-right pr-2">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            item.variacionPorcentaje > 0 
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                              : item.variacionPorcentaje < 0
                                ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
                          }`}>
                            {item.variacionPorcentaje > 0 ? '+' : ''}{item.variacionPorcentaje.toLocaleString('es-PE')}%
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredAndSortedData.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                          No se encontraron resultados para "{searchTerm}"
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50 dark:bg-slate-800/50 font-bold">
                    <tr>
                      <td className="px-6 py-4 text-slate-900 dark:text-white">TOTAL GENERAL</td>
                      <td className="px-6 py-4 text-right pr-2">{formatNumber(totalAnterior)}</td>
                      <td className="px-6 py-4 text-right pr-2">{formatNumber(totalActual)}</td>
                      <td className={`px-6 py-4 text-right pr-2 ${totalVariacionS > 0 ? 'text-emerald-600' : totalVariacionS < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                        {formatVariacion(totalVariacionS)}
                      </td>
                      <td className={`px-6 py-4 text-right pr-2 ${totalVariacionPorcentaje > 0 ? 'text-emerald-600' : totalVariacionPorcentaje < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                        {totalVariacionPorcentaje > 0 ? '+' : ''}{totalVariacionPorcentaje.toLocaleString('es-PE')}%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
          </>
        )}

        {/* Footer Information */}
        <footer className="mt-12 text-center text-slate-400 text-sm">
          <p>© 2024 MEF Data Analyzer. Basado en datos del Portal de Transparencia Económica - MEF Perú.</p>
          <div className="flex justify-center gap-4 mt-4">
            <a href="#" className="hover:text-primary transition-colors">Documentación</a>
            <a href="#" className="hover:text-primary transition-colors">Términos de Uso</a>
            <a href="#" className="hover:text-primary transition-colors">Privacidad</a>
          </div>
        </footer>
      </main>
    </div>
  );
}
