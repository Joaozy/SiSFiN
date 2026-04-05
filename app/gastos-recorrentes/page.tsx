import { Wrench } from 'lucide-react';

export default function GastosRecorrentesPage() {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto h-[75vh] flex flex-col items-center justify-center animate-in fade-in zoom-in duration-700">
      <div className="bg-white dark:bg-gray-800 p-10 md:p-14 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 text-center max-w-lg relative overflow-hidden">
        {/* Efeitos de luz no fundo do card */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="w-24 h-24 bg-gradient-to-tr from-emerald-100 to-cyan-100 dark:from-emerald-900/40 dark:to-cyan-900/40 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
            <Wrench size={48} strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
            Em Construção
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
            A gestão de <span className="font-semibold text-gray-700 dark:text-gray-300">Assinaturas e Gastos Fixos</span> está a ser desenvolvida. Em breve terá superpoderes para controlar todos os seus serviços!
          </p>
        </div>
      </div>
    </div>
  );
}