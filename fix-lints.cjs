const fs = require('fs');

function rr(path, search, replace) {
    if (fs.existsSync(path)) {
        let content = fs.readFileSync(path, 'utf8');
        fs.writeFileSync(path, content.replace(search, replace));
    }
}

rr('src/components/CanvasComponent/CanvasComponent.jsx', /catch\s*\(e\)\s*{/g, 'catch {');
rr('src/components/CreatorCard/CreatorCard.jsx', /avatar,\s*creator,/g, '');
rr('src/components/ErrorBoundary/ErrorBoundary.jsx', /catch\s*\(error\)\s*{/g, 'catch {');
rr('src/components/Login/Login.jsx', /useGetMeQuery,?\s*/g, '');
rr('src/components/Order/OrderForm.jsx', /data,\s*isLoading/g, 'isLoading');
rr('src/components/ProductCard/ProductCard.jsx', /const { width } = useWindowSize\(\);\s*\n/g, '');
rr('src/components/ProfileHeader/ProfileHeader.jsx', /avatar,\s*/g, '');
rr('src/components/TemplateStack/TemplateStack.jsx', /import { motion } from 'framer-motion';\s*\n/g, '');
rr('src/pages/CreatorPage.jsx', /const \[historyTrigger, setHistoryTrigger\] = useState\(0\);/g, 'const [, setHistoryTrigger] = useState(0);');
rr('src/pages/ProfilePage.jsx', /useMemo,\s*/g, '');
rr('src/pages/ProfilePage.jsx', /useListOrdersQuery,?\s*/g, '');
rr('src/pages/ProfilePage.jsx', /isError: isTemplatesError/g, '');
rr('src/pages/ProfilePage.jsx', /catch\s*\(err\)\s*{/g, 'catch {');
rr('src/pages/ReviewPage.jsx', /,\s*{ isLoading: isDeleting }/g, '');
rr('src/pages/ReviewPage.jsx', /catch\s*\(err\)\s*{/g, 'catch {');

// Vitest errors
rr('src/test/setup.js', /expect,?\s*/g, '');
rr('src/test/setup.js', /import { afterEach }/g, 'import { afterEach, vi }');
rr('src/test/setup.js', /global\./g, 'globalThis.');
rr('src/test/components/ErrorBoundary.test.jsx', /import { describe, it, expect, beforeEach }/g, 'import { describe, it, expect, beforeEach, vi }');
