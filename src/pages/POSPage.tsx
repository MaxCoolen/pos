import { useState } from 'react'
import { CategoryBar } from '../components/CategoryBar'
import { ProductGrid } from '../components/ProductGrid'
import { Cart } from '../components/Cart'

export function POSPage() {
  const [actieveCategorie, setActieveCategorie] = useState<string>('Alles')

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden px-6 pt-6 pb-0 gap-4" style={{ backgroundColor: 'var(--pos-panel)' }}>
        <CategoryBar actief={actieveCategorie} onChange={setActieveCategorie} />
        <div className="flex-1 overflow-y-auto pb-6">
          <ProductGrid actieveCategorie={actieveCategorie} />
        </div>
      </div>
      <Cart />
    </div>
  )
}
