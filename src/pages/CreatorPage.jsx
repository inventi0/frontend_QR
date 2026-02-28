import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import CanvasComponent from "../components/CanvasComponent/CanvasComponent";
import Toolbar from "../components/Toolbar/Toolbar";
import LayersPanel from "../components/LayersPanel/LayersPanel";
import styles from "./CreatorPage.module.scss";
import { useGetMeQuery } from "../api/authApi";
import {
  useCreateTemplateMutation,
  useListUserTemplatesQuery,
  useSetQrTemplateMutation,
  useUpdateTemplateMutation,
  useUpdateTemplateFileMutation,
} from "../api/accountApi";
import tshirtMockup from "../assets/tshirt_mockup.png";

export function CreatorPage() {
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');
  const [lineWidth, setLineWidth] = useState(5);
  const [selectedTool, setSelectedTool] = useState('pen');
  const [showMockup] = useState(false);
  const [showGrid] = useState(false);
  const [activeObject, setActiveObject] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const location = useLocation();
  const incomingTemplate = location.state?.template || null;
  const [currentTemplateId, setCurrentTemplateId] = useState(incomingTemplate?.id || null);
  const [theme] = useState('dark');
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateError, setTemplateError] = useState(null);
  const [isLayersPanelOpen, setIsLayersPanelOpen] = useState(false);
  const [layersSnapshot, setLayersSnapshot] = useState([]);
  const canvasComponentRef = useRef(null);
  const searchParams = new URLSearchParams(location.search);
  const incomingTemplateUrl =
    incomingTemplate?.file_url ||
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
  const [createTemplate, { isLoading: isCreating }] = useCreateTemplateMutation();
  const [setQrTemplate] = useSetQrTemplateMutation();
  const [updateTemplate, { isLoading: isUpdating }] = useUpdateTemplateMutation();
  const [updateTemplateFile, { isLoading: isUpdatingFile }] = useUpdateTemplateFileMutation();

  const isSavingTemplate = isCreating || isUpdating || isUpdatingFile;

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

  const [, setHistoryTrigger] = useState(0);

  const refreshLayers = useCallback(() => {
    if (canvasComponentRef.current) {
      setLayersSnapshot(canvasComponentRef.current.getLayers());
    }
  }, []);

  const handleHistoryChange = useCallback(() => {
    setHistoryTrigger((prev) => prev + 1);
    refreshLayers();
  }, [refreshLayers]);

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
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable) {
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
        e.preventDefault();
        handleRedo();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && activeObject && (selectedTool === 'image' || activeObject.type === 'text')) {
        e.preventDefault();
        canvasComponentRef.current?.deleteObject(activeObject.id);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'd' && activeObject && (selectedTool === 'image' || activeObject.type === 'text')) {
        e.preventDefault();
        canvasComponentRef.current?.duplicateObject(activeObject.id);
      } else if (e.key.startsWith('Arrow') && activeObject && (selectedTool === 'image' || activeObject.type === 'text')) {
        e.preventDefault();
        const amount = e.shiftKey ? 10 : 1;
        let dx = 0, dy = 0;
        if (e.key === 'ArrowUp') dy = -amount;
        if (e.key === 'ArrowDown') dy = amount;
        if (e.key === 'ArrowLeft') dx = -amount;
        if (e.key === 'ArrowRight') dx = amount;
        if (dx !== 0 || dy !== 0) {
          canvasComponentRef.current?.nudgeObject(activeObject.id, dx, dy);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, activeObject, selectedTool]);

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
      setSelectedTool('image'); // Switch to move tool automatically
    }
  }, []);

  const handleLoadTemplateFromCloud = useCallback((tpl) => {
    if (!tpl?.file_url || !canvasComponentRef.current) return;
    canvasComponentRef.current.loadFromUrl(tpl.file_url).catch(() => { });
  }, []);

  const handleSaveAsTemplate = useCallback(async () => {
    if (!canvasComponentRef.current || !userId) {
      alert('Сохранение доступно только после входа.');
      return;
    }

    const defaultName = `Дизайн ${new Date().toLocaleDateString('ru-RU')}`;
    const templateName = prompt('Введите название нового шаблона:', defaultName);

    if (!templateName || !templateName.trim()) {
      return;
    }

    if (templateName.length > 60) {
      alert('Название слишком длинное (максимум 60 символов).');
      return;
    }

    const blob = await canvasComponentRef.current.toBlob();
    if (!blob) return;
    const file = new File([blob], 'template.png', { type: 'image/png' });

    try {
      // Step 1: Upload preview PNG
      const saved = await createTemplate({
        file,
        name: templateName.trim(),
      }).unwrap();

      const newId = saved.id;

      // Step 2: Export scene and persist in description
      try {
        const scene = canvasComponentRef.current.exportScene();
        const sceneJson = JSON.stringify(scene);
        await updateTemplate({
          templateId: newId,
          description: sceneJson,
        }).unwrap();
      } catch (sceneErr) {
        console.warn('Сцена не сохранена, шаблон доступен только как изображение', sceneErr);
      }

      if (incomingQrId) {
        try {
          await setQrTemplate({ template_id: newId }).unwrap();
        } catch (err) {
          console.error("Attach template failed", err);
        }
      }
      setCurrentTemplateId(newId);
      setIsDirty(false);
      alert('Шаблон сохранён');
    } catch (error) {
      console.error(error);
      alert('Не удалось сохранить шаблон. Попробуйте снова.');
    }
  }, [createTemplate, updateTemplate, userId, incomingQrId, setQrTemplate]);

  const handleSaveTemplate = useCallback(async () => {
    if (!canvasComponentRef.current || !userId) {
      alert('Сохранение доступно только после входа.');
      return;
    }

    // Если нет текущего ID, то "Сохранить" работает как "Сохранить как..." (создание нового)
    if (!currentTemplateId) {
      return handleSaveAsTemplate();
    }

    if (!isDirty) {
      alert('Нет изменений для сохранения.');
      return;
    }

    const confirmUpdate = window.confirm(`Обновить шаблон «${incomingTemplate?.name || 'Без названия'}»? Это перезапишет текущую версию.`);
    if (!confirmUpdate) return;

    const blob = await canvasComponentRef.current.toBlob();
    if (!blob) return;
    const file = new File([blob], 'template.png', { type: 'image/png' });

    try {
      // Step 1: Update preview PNG
      await updateTemplateFile({
        templateId: currentTemplateId,
        file,
      }).unwrap();

      // Step 2: Export scene and persist in description
      try {
        const scene = canvasComponentRef.current.exportScene();
        const sceneJson = JSON.stringify(scene);
        await updateTemplate({
          templateId: currentTemplateId,
          name: incomingTemplate?.name || 'Без названия',
          description: sceneJson,
        }).unwrap();
      } catch (sceneErr) {
        console.warn('Сцена не сохранена, шаблон доступен только как изображение', sceneErr);
      }

      if (incomingQrId) {
        try {
          await setQrTemplate({ template_id: currentTemplateId }).unwrap();
        } catch (err) {
          console.error("Attach template failed", err);
        }
      }
      setIsDirty(false);
      alert('Шаблон обновлён');
    } catch (error) {
      console.error(error);
      alert('Не удалось обновить шаблон. Попробуйте снова.');
    }
  }, [updateTemplate, updateTemplateFile, userId, incomingQrId, setQrTemplate, currentTemplateId, isDirty, incomingTemplate, handleSaveAsTemplate]);

  // --- Template / Scene loading ---
  useEffect(() => {
    if (!incomingTemplate && !incomingTemplateUrl) return;

    let cancelled = false;

    const tryLoad = () => {
      if (cancelled) return;
      if (!canvasComponentRef.current) {
        requestAnimationFrame(tryLoad);
        return;
      }

      setTemplateLoading(true);
      setTemplateError(null);

      // Try scene restore from description first
      let scene = null;
      if (incomingTemplate?.description) {
        try {
          const parsed = JSON.parse(incomingTemplate.description);
          if (parsed?.version && Array.isArray(parsed?.layers)) {
            scene = parsed;
          }
        } catch { /* not valid scene JSON, ignore */ }
      }

      if (scene) {
        // Full scene restore
        canvasComponentRef.current
          .importScene(scene)
          .then(() => {
            if (!cancelled) {
              setTemplateLoading(false);
              refreshLayers();
            }
          })
          .catch((err) => {
            if (!cancelled) {
              setTemplateLoading(false);
              setTemplateError(err?.message || 'Не удалось восстановить сцену');
            }
          });
      } else if (incomingTemplateUrl) {
        // Fallback: load preview bitmap as image layer
        canvasComponentRef.current
          .loadFromUrl(incomingTemplateUrl)
          .then(() => {
            if (!cancelled) {
              setTemplateLoading(false);
              refreshLayers();
            }
          })
          .catch((err) => {
            if (!cancelled) {
              setTemplateLoading(false);
              setTemplateError(err?.message || 'Не удалось загрузить шаблон');
            }
          });
      } else {
        setTemplateLoading(false);
      }
    };

    tryLoad();
    return () => { cancelled = true; };
  }, [incomingTemplate, incomingTemplateUrl, refreshLayers]);

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
              header.classList.add('header-hidden');
            } else {
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

  // Mobile Properties Panel State
  const [isPropsPanelOpen, setIsPropsPanelOpen] = useState(false);

  // Auto-open mobile props panel when image is selected
  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (!isMobile) return;
    if (activeObject && selectedTool === 'image') {
      setIsPropsPanelOpen(true);
    }
  }, [activeObject, selectedTool]);

  return (
    <div className={styles.appContainer}>
      <main className={styles.mainContent}>
        <div className={styles.editorContainer}>
          {!isAuthenticated && (
            <div className={styles.readOnlyBanner}>
              Авторизуйтесь, чтобы редактировать. Просмотр доступен всем.
            </div>
          )}

          {templateLoading && (
            <div className={styles.loadingBanner}>Загрузка шаблона…</div>
          )}
          {templateError && (
            <div className={styles.errorBanner}>
              {templateError}
              <button onClick={() => setTemplateError(null)}>✕</button>
            </div>
          )}

          <div
            className={styles.canvasContainer}
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
              onActiveObjectChange={(obj) => { setActiveObject(obj); refreshLayers(); }}
              onToolChange={setSelectedTool}
            />

            {isLayersPanelOpen && (
              <LayersPanel
                layers={layersSnapshot}
                activeLayerId={canvasComponentRef.current?.getActiveLayerId()}
                activePaintLayerId={canvasComponentRef.current?.getActivePaintLayerId()}
                onSelectLayer={(id) => { canvasComponentRef.current?.selectLayer(id); refreshLayers(); }}
                onMoveLayer={(id, dir) => { canvasComponentRef.current?.moveLayer(id, dir); refreshLayers(); }}
                onDeleteLayer={(id) => { canvasComponentRef.current?.deleteLayer(id); refreshLayers(); }}
                onToggleVisibility={(id) => { canvasComponentRef.current?.toggleLayerVisibility(id); refreshLayers(); }}
                onAddPaintLayer={() => { canvasComponentRef.current?.addPaintLayer(); refreshLayers(); }}
                onClose={() => setIsLayersPanelOpen(false)}
              />
            )}
          </div>

          <Toolbar
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
            lineWidth={lineWidth}
            setLineWidth={setLineWidth}
            selectedTool={selectedTool}
            setSelectedTool={(tool) => {
              if (tool !== 'text' && tool !== 'image') {
                canvasComponentRef.current?.exitTextMode?.();
              }
              setSelectedTool(tool);
            }}
            clearCanvas={handleClearCanvas}
            downloadImage={handleDownloadImage}
            onImportImage={handleImportImage}
            onSaveTemplate={handleSaveTemplate}
            onSaveAsTemplate={handleSaveAsTemplate}
            savingTemplate={isSavingTemplate}
            isEditMode={!!currentTemplateId}
            templateOptions={templates || []}
            onLoadTemplateFromCloud={handleLoadTemplateFromCloud}
            isReadOnly={!isAuthenticated}
            showMockup={showMockup}
            showGrid={showGrid}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={canUndo}
            canRedo={canRedo}
            isPropsPanelOpen={isPropsPanelOpen}
            onToggleProps={setIsPropsPanelOpen}
            activeObject={activeObject}
            onApplyHelper={(mode) => canvasComponentRef.current?.applyObjectHelper(activeObject?.id, mode)}
            onLayerOrder={(dir) => canvasComponentRef.current?.reorderObject(activeObject?.id, dir)}
            onDeleteObject={() => canvasComponentRef.current?.deleteObject(activeObject?.id)}
            onDuplicateObject={() => canvasComponentRef.current?.duplicateObject(activeObject?.id)}
            onChangeOpacity={(opacity) => canvasComponentRef.current?.changeObjectOpacity(activeObject?.id, opacity)}
            onUpdateText={(updates) => {
              if (activeObject) {
                canvasComponentRef.current?.updateLayer(activeObject.id, updates);
                const layers = canvasComponentRef.current?.getLayers() || [];
                const updated = layers.find(l => l.id === activeObject.id);
                if (updated) setActiveObject(updated);
              }
            }}
            onCommitText={() => canvasComponentRef.current?.commitTextEdit()}
            isLayersPanelOpen={isLayersPanelOpen}
            onToggleLayers={() => setIsLayersPanelOpen(v => !v)}
          />
        </div>
      </main>
    </div>
  );
}

export default CreatorPage;
