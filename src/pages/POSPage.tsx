import { useState } from 'react'
import { CategoryBar } from '../components/CategoryBar'
import { ProductGrid } from '../components/ProductGrid'
import { Cart } from '../components/Cart'

export function POSPage() {
  const [actieveCategorie, setActieveCategorie] = useState<string>('Alles')

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden p-6 gap-5 bg-gray-50 dark:bg-slate-900">
        <CategoryBar actief={actieveCategorie} onChange={setActieveCategorie} />
        <div className="flex-1 overflow-y-auto">
          <ProductGrid actieveCategorie={actieveCategorie} />
        </div>
      </div>
      <Cart />
    </div>
  )
}
