"use client"

/**
 * ExpandedGoalsContext.tsx
 * 
 * CONTEXTO CENTRAL PARA CONTROLE DE CARDS EXPANDIDOS
 * 
 * IMPORTÂNCIA DESTE ARQUIVO:
 * ✅ Evita "pulinhos" (jank) nas animações dos cards
 * ✅ Permite controle centralizado do estado de expansão
 * ✅ Possibilita implementar botão "Fechar todos" no futuro
 * ✅ Estado não se perde ao fazer scroll
 * ✅ Animações ficam sincronizadas e suaves
 * ✅ Performance melhor (limite de 15 cards abertos)
 * 
 * SEM este contexto:
 * ❌ Cada card controla seu próprio estado (conflitos)
 * ❌ Animações entram em conflito
 * ❌ "Pulinhos" voltam ao expandir/colapsar
 * ❌ Estado se perde ao scroll
 * ❌ Impossível ter controle global
 * 
 * FUNCIONAMENTO:
 * - Mantém array de IDs dos cards expandidos
 * - Limite de 15 cards abertos simultaneamente
 * - Quando excede o limite, remove o mais antigo (FIFO)
 * - Fornece funções para toggle, close all e verificação
 */

import React, { createContext, useContext, useState } from "react"

// GUIDE: Interface do contexto - define as funções disponíveis
interface ExpandedGoalsContextType {
  expandedGoals: number[] // Array de IDs dos cards expandidos
  toggleGoal: (id: number) => void // Abre/fecha um card específico
  closeAllGoals: () => void // Fecha todos os cards (para botão futuro)
  isExpanded: (id: number) => boolean // Verifica se um card está expandido
}

// GUIDE: Criar o contexto com valor padrão undefined
const ExpandedGoalsContext = createContext<ExpandedGoalsContextType | undefined>(undefined)

/**
 * Provider do contexto de cards expandidos
 * 
 * DEVE ser colocado no layout.tsx envolvendo {children}
 * para que todos os componentes da aplicação tenham acesso
 */
export function ExpandedGoalsProvider({ children }: { children: React.ReactNode }) {
  // GUIDE: Estado central - array de IDs dos cards expandidos
  const [expandedGoals, setExpandedGoals] = useState<number[]>([])

  /**
   * Toggle de expansão de um card
   * 
   * LÓGICA:
   * 1. Se já está expandido -> Remove da lista (colapsa)
   * 2. Se não está expandido:
   *    - Se já tem 15 cards abertos -> Remove o mais antigo e adiciona o novo
   *    - Se tem menos de 15 -> Apenas adiciona
   * 
   * LIMITE DE 15: Performance! Muitos cards abertos causam lag
   */
  const toggleGoal = (id: number) => {
    setExpandedGoals((prev) => {
      // CASO 1: Card já está expandido -> Colapsar
      if (prev.includes(id)) {
        return prev.filter((goalId) => goalId !== id)
      }

      // CASO 2: Card não está expandido -> Expandir
      
      // LIMITE DE 15 CARDS: Remove o mais antigo se exceder
      if (prev.length >= 15) {
        // FIFO (First In, First Out): Remove o primeiro, adiciona no final
        const newArray = [...prev.slice(1), id]
        console.log(`⚠️ Limite de 15 cards atingido. Removendo card ${prev[0]}`)
        return newArray
      }

      // Adiciona normalmente
      return [...prev, id]
    })
  }

  /**
   * Fecha todos os cards expandidos
   * 
   * ÚTIL PARA:
   * - Botão "Fechar todos" (Sprint 2)
   * - Reset ao trocar de filtro
   * - Limpar estado ao fazer logout
   */
  const closeAllGoals = () => {
    setExpandedGoals([])
  }

  /**
   * Verifica se um card específico está expandido
   * 
   * USADO NO GOALCARD:
   * const expanded = isExpanded(goal.id)
   */
  const isExpanded = (id: number): boolean => {
    return expandedGoals.includes(id)
  }

  // GUIDE: Valor fornecido pelo contexto
  const value: ExpandedGoalsContextType = {
    expandedGoals,
    toggleGoal,
    closeAllGoals,
    isExpanded,
  }

  return (
    <ExpandedGoalsContext.Provider value={value}>
      {children}
    </ExpandedGoalsContext.Provider>
  )
}

/**
 * Hook customizado para usar o contexto
 * 
 * USO NOS COMPONENTES:
 * const { toggleGoal, isExpanded } = useExpandedGoals()
 * const expanded = isExpanded(goal.id)
 * 
 * onClick={() => toggleGoal(goal.id)}
 */
export function useExpandedGoals() {
  const context = useContext(ExpandedGoalsContext)
  
  // GUARD: Verifica se o hook está sendo usado dentro do Provider
  if (context === undefined) {
    throw new Error(
      "useExpandedGoals deve ser usado dentro de ExpandedGoalsProvider. " +
      "Verifique se o Provider foi adicionado no layout.tsx!"
    )
  }
  
  return context
}

/**
 * COMO USAR ESTE CONTEXTO:
 * 
 * 1. No layout.tsx:
 * 
 * import { ExpandedGoalsProvider } from "@/contexts/ExpandedGoalsContext"
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html lang="pt-BR">
 *       <body>
 *         <ExpandedGoalsProvider>
 *           {children}
 *         </ExpandedGoalsProvider>
 *       </body>
 *     </html>
 *   )
 * }
 * 
 * 2. No GoalCard.tsx:
 * 
 * import { useExpandedGoals } from "@/contexts/ExpandedGoalsContext"
 * 
 * function GoalCard({ goal }) {
 *   const { toggleGoal, isExpanded } = useExpandedGoals()
 *   const expanded = isExpanded(goal.id)
 *   
 *   return (
 *     <motion.div
 *       layout
 *       onClick={() => toggleGoal(goal.id)}
 *     >
 *       ...
 *     </motion.div>
 *   )
 * }
 * 
 * BENEFÍCIOS:
 * ✅ Animações suaves e sem conflitos
 * ✅ Estado persistente durante scroll
 * ✅ Controle centralizado
 * ✅ Fácil adicionar features futuras
 * ✅ Performance otimizada
 */
