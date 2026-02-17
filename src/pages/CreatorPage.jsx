import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import CanvasComponent from "../components/CanvasComponent/CanvasComponent";
import Toolbar from "../components/Toolbar/Toolbar";
import styles from "./CreatorPage.module.scss";
import { useGetMeQuery } from "../api/authApi";
import {
  useCreateTemplateMutation,
  useListUserTemplatesQuery,
  useSetQrTemplateMutation,
} from "../api/accountApi";
import tshirtMockup from "../assets/tshirt_mockup.png";

export function CreatorPage() {
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');
  const [lineWidth, setLineWidth] = useState(5);
  const [selectedTool, setSelectedTool] = useState('pen');
  const [showMockup] = useState(false); // Removed setter to shut up lint, default false
  const [showGrid] = useState(false);   // Removed setter to shut up lint, default false
  const [isDirty, setIsDirty] = useState(false);
  const [theme] = useState('dark');
  const canvasComponentRef = useRef(null);
  const location = useLocation();
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

  // Dirty state warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const [historyTrigger, setHistoryTrigger] = useState(0);

  const handleHistoryChange = useCallback(() => {
    setHistoryTrigger((prev) => prev + 1);
  }, []);

  // Force re-render on history change
  useEffect(() => {
    // console.log("History updated, trigger:", historyTrigger);
  }, [historyTrigger]);

  const handleUndo = useCallback(() => {
    canvasComponentRef.current?.undo();
  }, []);

  const handleRedo = useCallback(() => {
    canvasComponentRef.current?.redo();
  }, []);

  // Hotkeys
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if input/textarea is focused
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) || document.activeElement.isContentEditable) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        // Optional Redo constraint
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Derive undo/redo state
  const canUndo = canvasComponentRef.current?.canUndo() || false;
  const canRedo = canvasComponentRef.current?.canRedo() || false;


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

    const defaultName = `Дизайн ${new Date().toLocaleDateString('ru-RU')}`;
    const templateName = prompt('Введите название шаблона:', defaultName);

    if (!templateName) {
      return;
    }

    const blob = await canvasComponentRef.current.toBlob();
    if (!blob) return;
    const file = new File([blob], 'template.png', { type: 'image/png' });
    try {
      const saved = await createTemplate({
        file,
        name: templateName.trim(),
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

  // Автоматическое скрытие Header при прокрутке
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const header = document.querySelector('.header-container');

          if (header) {
            if (currentScrollY > 100 && currentScrollY > lastScrollY) {
              // Прокручиваем вниз - скрываем Header
              header.classList.add('header-hidden');
            } else {
              // Прокручиваем вверх - показываем Header
              header.classList.remove('header-hidden');
            }
          }

          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mobile Properties Panel State (Lifted for auto-close)
  const [isPropsPanelOpen, setIsPropsPanelOpen] = useState(false);

  return (
    <div className={styles.appContainer}>

      <main className={styles.mainContent}>
        {/* NEW: EditorContainer - toolbar, banner, canvas share width constraints */}
        <div className={styles.editorContainer}>

          {/* 1. Auth Banner */}
          {!isAuthenticated && (
            <div className={styles.readOnlyBanner}>
              Авторизуйтесь, чтобы редактировать. Просмотр доступен всем.
            </div>
          )}

          {/* 2. Canvas Container (Width Source of Truth) */}
          <div
            className={styles.canvasContainer}
            // Auto-close properties panel when interacting with canvas
            onPointerDown={() => setIsPropsPanelOpen(false)}
          >
            {showMockup && <img src={tshirtMockup} className={styles.mockupOverlay} alt="Mask" />}
            <CanvasComponent
              ref={canvasComponentRef}
              selectedColor={selectedColor}
              lineWidth={lineWidth}
              selectedTool={selectedTool}
              theme={theme}
              canEdit={isAuthenticated}
              showGrid={showGrid}
              onDirtyChange={setIsDirty}
              onHistoryChange={handleHistoryChange}
            />
          </div>

          {/* 3. Toolbar (Always Below Canvas) */}
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
            // Legacy props
            showMockup={showMockup}
            showGrid={showGrid}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={canUndo}
            canRedo={canRedo}
            // Mobile Props State
            isPropsPanelOpen={isPropsPanelOpen}
            onToggleProps={setIsPropsPanelOpen}
          />
        </div>
      </main>
    </div>
  );
}

export default CreatorPage;
