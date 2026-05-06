const files = [
     { name: 'ProjectPlan.pdf', size: '1.2MB' },
     { name: 'Wireframes.png', size: '3.5MB' },
]

export default function SharedFiles() {
     return (
          <div className="rounded-2xl bg-card p-4 shadow">
               <h3 className="text-lg font-bold mb-4">Shared Files</h3>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {files.map(f => (
                         <div key={f.name} className="flex flex-col items-center rounded-xl border border-border p-3 transition hover:bg-muted/60">
                              <div className="mb-2 text-2xl text-chart-3">📄</div>
                              <p className="text-sm font-medium">{f.name}</p>
                              <p className="text-xs text-muted-foreground">{f.size}</p>
                         </div>
                    ))}
               </div>
          </div>
     )
}
