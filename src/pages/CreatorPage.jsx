import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
import CanvasComponent from "../components/CanvasComponent/CanvasComponent";
import Toolbar from "../components/Toolbar/Toolbar";
import styles from "./CreatorPage.module.scss";
import { useGetMeQuery } from "../api/authApi";
import {
  useCreateTemplateMutation,
  useListUserTemplatesQuery,
  useSetQrTemplateMutation,
} from "../api/accountApi";

export function CreatorPage() {
  const [selectedColor, setSelectedColor] = useState('#FFFFFF'); // Default: white for dark theme
  const [lineWidth, setLineWidth] = useState(5);
  const [selectedTool, setSelectedTool] = useState('pen'); // 'pen', 'eraser', 'rectangle', 'circle', 'bucket'
  const [theme, setTheme] = useState('dark');
  const canvasComponentRef = useRef(null);
  const location = useLocation();
  const { publicId } = useParams();
  const searchParams = new URLSearchParams(location.search);
  const incomingTemplateUrl =
    location.state?.templateUrl ||
    searchParams.get("template") ||
    null;
  const incomingQrId = location.state?.qrId || null;
  const { data: me } = useGetMeQuery();
  const userId = me?.id;
  const isAuthenticated = !!userId;
  const { data: templates } = useListUserTemplatesQuery(
    { userId, includeGlobal: true, limit: 50, offset: 0 },
    { skip: !userId }
  );
  const [createTemplate, { isLoading: isSavingTemplate }] = useCreateTemplateMutation();
  const [setQrTemplate] = useSetQrTemplateMutation();

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

  const handleImportImage = useCallback((file) => {
    if (canvasComponentRef.current) {
      canvasComponentRef.current.loadFromFile(file);
    }
  }, []);

  const handleLoadTemplateFromCloud = useCallback((tpl) => {
    if (!tpl?.file_url || !canvasComponentRef.current) return;
    canvasComponentRef.current.loadFromUrl(tpl.file_url);
  }, []);

  const handleSaveTemplate = useCallback(async () => {
    if (!canvasComponentRef.current || !userId) {
      alert('Сохранение доступно только после входа.');
      return;
    }
    const blob = await canvasComponentRef.current.toBlob();
    if (!blob) return;
    const file = new File([blob], 'template.png', { type: 'image/png' });
    try {
      const saved = await createTemplate({
        file,
        name: `Template ${new Date().toLocaleString()}`,
      }).unwrap();
      if (incomingQrId) {
        try {
          await setQrTemplate({ template_id: saved.id }).unwrap();
        } catch (err) {
          console.error("Attach template failed", err);
        }
      }
      alert('Шаблон сохранён в вашем списке.');
    } catch (error) {
      console.error(error);
      alert('Не удалось сохранить шаблон.');
    }
  }, [createTemplate, userId, incomingQrId, setQrTemplate]);

  useEffect(() => {
    if (incomingTemplateUrl && canvasComponentRef.current) {
      canvasComponentRef.current.loadFromUrl(incomingTemplateUrl);
    }
  }, [incomingTemplateUrl]);

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
          onImportImage={handleImportImage}
          onSaveTemplate={handleSaveTemplate}
          savingTemplate={isSavingTemplate}
          templateOptions={templates || []}
          onLoadTemplateFromCloud={handleLoadTemplateFromCloud}
          isReadOnly={!isAuthenticated}
        />
        <div className={styles.canvasContainer}>
          <CanvasComponent
            ref={canvasComponentRef}
            selectedColor={selectedColor}
            lineWidth={lineWidth}
            selectedTool={selectedTool}
            theme={theme}
            canEdit={isAuthenticated}
          />
          {!isAuthenticated && (
            <div className={styles.readOnlyBanner}>
              Авторизуйтесь, чтобы редактировать. Просмотр доступен всем.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default CreatorPage;
