import fs from 'fs';

const file = '/Users/neshmapatel/Desktop/Upal Projects/stock_inventory/stock-front/app/dashboard/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add Input import
if (!content.includes('import { Input }')) {
  content = content.replace('import { Button }', 'import { Button }\nimport { Input }');
}
// 2. Add Search icon
if (!content.includes('Search,')) {
  content = content.replace('X,', 'X,\n  Search,');
}

// 3. Add state variables for pagination and search
const stateBlockOld = `  const [lowStockPage, setLowStockPage] = React.useState(1);`;
const stateBlockNew = `  const [lowStockPage, setLowStockPage] = React.useState(1);
  const [lowStockSearch, setLowStockSearch] = React.useState("");
  const [lowStockCatPage, setLowStockCatPage] = React.useState(1);
  const [lowStockCatSearch, setLowStockCatSearch] = React.useState("");`;
content = content.replace(stateBlockOld, stateBlockNew);

// 4. Update query parameters
const queryKeyOld = `      revProdPage, revProdSort,
      lowStockPage,`;
const queryKeyNew = `      revProdPage, revProdSort,
      lowStockPage, lowStockSearch,
      lowStockCatPage, lowStockCatSearch,`;
content = content.replace(queryKeyOld, queryKeyNew);

const queryFnOld = `        revProdPage, revProdLimit: LIMIT, revProdSort,
        lowStockPage, lowStockLimit: LOW_STOCK_LIMIT,
      }),`;
const queryFnNew = `        revProdPage, revProdLimit: LIMIT, revProdSort,
        lowStockPage, lowStockLimit: LOW_STOCK_LIMIT, lowStockSearch,
        lowStockCatPage, lowStockCatLimit: LOW_STOCK_LIMIT, lowStockCatSearch,
      }),`;
content = content.replace(queryFnOld, queryFnNew);

// 5. Update UI for Products Below Threshold
const productsTotalPagesOld = `  const lowStockTotalPages = Math.ceil((analytics?.lowStockProducts?.total || 0) / LOW_STOCK_LIMIT) || 1;`;
const productsTotalPagesNew = `  const lowStockTotalPages = Math.ceil((analytics?.lowStockProducts?.total || 0) / LOW_STOCK_LIMIT) || 1;
  const lowStockCatTotalPages = Math.ceil((analytics?.lowStockCategories?.total || 0) / LOW_STOCK_LIMIT) || 1;`;
content = content.replace(productsTotalPagesOld, productsTotalPagesNew);

const prodHeaderOld = `              <MiniPagination
                page={lowStockPage}
                totalPages={lowStockTotalPages}
                onPrev={() => setLowStockPage(p => p - 1)}
                onNext={() => setLowStockPage(p => p + 1)}
              />
            </CardHeader>`;
const prodHeaderNew = `              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search product..."
                    className="h-8 w-[150px] pl-8 text-xs bg-background/50 border-border/60 focus-visible:ring-1"
                    value={lowStockSearch}
                    onChange={(e) => {
                      setLowStockSearch(e.target.value);
                      setLowStockPage(1);
                    }}
                  />
                </div>
                <MiniPagination
                  page={lowStockPage}
                  totalPages={lowStockTotalPages}
                  onPrev={() => setLowStockPage(p => p - 1)}
                  onNext={() => setLowStockPage(p => p + 1)}
                />
              </div>
            </CardHeader>`;
content = content.replace(prodHeaderOld, prodHeaderNew);

// 6. Update UI for Categories
const catHeaderOld = `              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold tracking-tight">By Category</CardTitle>
                  <CardDescription className="text-[11px]">Low-stock items grouped</CardDescription>
                </div>
              </div>
            </CardHeader>`;
const catHeaderNew = `              <div className="flex flex-row items-start justify-between gap-2 w-full">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold tracking-tight">By Category</CardTitle>
                    <CardDescription className="text-[11px]">Low-stock items grouped</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search category..."
                      className="h-8 w-[130px] pl-8 text-xs bg-background/50 border-border/60 focus-visible:ring-1"
                      value={lowStockCatSearch}
                      onChange={(e) => {
                        setLowStockCatSearch(e.target.value);
                        setLowStockCatPage(1);
                      }}
                    />
                  </div>
                  <MiniPagination
                    page={lowStockCatPage}
                    totalPages={lowStockCatTotalPages}
                    onPrev={() => setLowStockCatPage(p => p - 1)}
                    onNext={() => setLowStockCatPage(p => p + 1)}
                  />
                </div>
              </div>
            </CardHeader>`;
content = content.replace(catHeaderOld, catHeaderNew);

fs.writeFileSync(file, content);
console.log('Updated frontend code.');
