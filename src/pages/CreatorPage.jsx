import { useState, useEffect, useCallback, useRef } from 'react';
import CanvasComponent from '../components/CanvasComponent/CanvasComponent';
import Toolbar from '../components/Toolbar/Toolbar';
import styles from './CreatorPage.module.scss';

export function CreatorPage() {
  const [selectedColor, setSelectedColor] = useState('#FFFFFF'); // Default: white for dark theme
  const [lineWidth, setLineWidth] = useState(5);
  const [selectedTool, setSelectedTool] = useState('pen'); // 'pen', 'eraser', 'rectangle', 'circle', 'bucket'
  const [theme, setTheme] = useState('dark');
  const canvasComponentRef = useRef(null);

  useEffect(() => {
    document.body.className = theme === 'light' ? 'light-theme' : '';
    setSelectedColor(theme === 'light' ? '#000000' : '#FFFFFF');
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  }, []);

  const handleClearCanvas = useCallback(() => {
    if (canvasComponentRef.current) {
      canvasComponentRef.current.clearCanvas();
    }
  }, []);

  const handleDownloadImage = useCallback(() => {
    if (canvasComponentRef.current) {
      canvasComponentRef.current.downloadImage();
    }
  }, []); 

  return (
    <div className={styles.appContainer}>

      <main className={styles.mainContent}>
        <Toolbar
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          lineWidth={lineWidth}
          setLineWidth={setLineWidth}
          selectedTool={selectedTool}
          setSelectedTool={setSelectedTool}
          clearCanvas={handleClearCanvas}
          downloadImage={handleDownloadImage}
        />
        <div className={styles.canvasContainer}>
          <CanvasComponent
            ref={canvasComponentRef}
            selectedColor={selectedColor}
            lineWidth={lineWidth}
            selectedTool={selectedTool}
            theme={theme}
          />
        </div>
      </main>
    </div>
  );
}

export default CreatorPage;