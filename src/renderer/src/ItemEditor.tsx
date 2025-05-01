import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  InputAdornment,
  Stack,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tooltip,
  ThemeProvider,
  Chip,
  LinearProgress,
  Avatar,
} from '@mui/material';
import { customTheme } from './App';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FolderIcon from '@mui/icons-material/Folder';
import SettingsIcon from '@mui/icons-material/Settings';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import ImageIcon from '@mui/icons-material/Image';
import PreviewIcon from '@mui/icons-material/Preview';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import DownloadIcon from '@mui/icons-material/Download';
import ProjectManifestEditor from './ProjectManifestEditor';
import AIImport from './AIImport';

interface Item {
  id: string;
  name: string;
  example: string;
  description: [string, string];
  image: string;
  audio: [string, string];
  count: number;
}

interface ProjectManifest {
  name: string;
  backgroundColor: string;
  characterColor: [string, string];
  title: string;
  subtitle: string;
}

interface ItemEditorProps {
  onBack: () => void;
  projectName: string;
}

export default function ItemEditor({ onBack, projectName }: ItemEditorProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [_refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [draggedOverItem, setDraggedOverItem] = useState<number | null>(null);

  const [fetchingData, setFetchingData] = useState(false);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [showProgress, setShowProgress] = useState(false);

  const [generatingExample, setGeneratingExample] = useState(false);

  const autoRefreshIntervalRef = useRef<number | null>(null);
  const lastRefreshTimeRef = useRef<number>(Date.now());

  const [aiImportDialogOpen, setAiImportDialogOpen] = useState(false);

  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [audioPaths, setAudioPaths] = useState<[string, string]>(['', '']);
  const [audioBase64, setAudioBase64] = useState<[string, string]>(['', '']);
  const [imagePaths, setImagePaths] = useState<string[]>([]);
  const [imageBase64, setImageBase64] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState<number | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [defaultImageIndex, setDefaultImageIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [projectManifestOpen, setProjectManifestOpen] = useState(false);

  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [generateVideoDialogOpen, setGenerateVideoDialogOpen] = useState(false);
  const [videoOutputPath, setVideoOutputPath] = useState('');

  const [clearingCache, setClearingCache] = useState(false);
  const [clearCacheDialogOpen, setClearCacheDialogOpen] = useState(false);

  const handleOpenClearCacheDialog = () => {
    setClearCacheDialogOpen(true);
  };

  const handleClearCache = async () => {
    try {
      setClearingCache(true);
      setClearCacheDialogOpen(false);

      showAlert('正在清除缓存，请稍候...', 'info');

      const result = await window.api.clearProjectCache(projectName);

      if (result.success) {
        showAlert('缓存已成功清除', 'success');

        loadItems();
      } else {
        showAlert(`清除缓存失败: ${result.message || '未知错误'}`, 'error');
      }
    } catch (error) {
      console.error('清除缓存失败:', error);
      showAlert(`清除缓存失败: ${error}`, 'error');
    } finally {
      setClearingCache(false);
    }
  };

  const hasLoadedRef = useRef(false);

  const [formData, setFormData] = useState<{
    name: string;
    example: string;
    description: [string, string];
    count: number;
  }>({
    name: '',
    example: '',
    description: ['', ''],
    count: 1,
  });

  const [nameError, setNameError] = useState('');
  const [exampleSentenceError, setExampleSentenceError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');

  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const loadItems = useCallback(async (silent: boolean = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        const currentTime = Date.now();
        if (currentTime - lastRefreshTimeRef.current < 3000) {
          return;
        }
        setRefreshing(true);
        lastRefreshTimeRef.current = currentTime;
      }

      const result = await window.api.getAllItem();

      if (result.success) {
        setItems(result.items);
      } else {
        showAlert(result.message || '获取数据失败', 'error');
      }
    } catch (error) {
      console.error('获取数据失败:', error);
      if (!silent) {
        showAlert('获取数据失败', 'error');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedRef.current) {
      loadItems();
      hasLoadedRef.current = true;

      setupProgressListeners();
    }

    return () => {
      if (autoRefreshIntervalRef.current !== null) {
        clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = null;
      }
    };
  }, [loadItems]);

  const setupProgressListeners = async () => {
    await window.api.onFetchingProgress(async message => {
      setProgressMessage(message);
      setShowProgress(true);
    });

    await window.api.onGeneratingProgress(async message => {
      setProgressMessage(message);
      setShowProgress(true);
    });
  };

  useEffect(() => {
    if (autoRefreshIntervalRef.current !== null) {
      clearInterval(autoRefreshIntervalRef.current);
      autoRefreshIntervalRef.current = null;
    }
    autoRefreshIntervalRef.current = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadItems(true);
      }
    }, 30000);
    return () => {
      if (autoRefreshIntervalRef.current !== null) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, [loadItems]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const currentTime = Date.now();
        if (currentTime - lastRefreshTimeRef.current > 5000) {
          loadItems(true);
          lastRefreshTimeRef.current = currentTime;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadItems]);

  const showAlert = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setAlert({
      open: true,
      message,
      severity,
    });
  };

  const debounceTimerRef = useRef<number | null>(null);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
      setSearchQuery(value);
      debounceTimerRef.current = null;
    }, 300);

    event.target.value = value;
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleInputChange = (field: string, value: string | number, descriptionIndex?: number) => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
    }

    if (field === 'description' && typeof descriptionIndex === 'number') {
      setFormData(prev => {
        const newDescription = [...prev.description] as [string, string];
        newDescription[descriptionIndex] = value as string;
        return {
          ...prev,
          description: newDescription,
        };
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }

    debounceTimerRef.current = window.setTimeout(() => {
      if (field === 'name') {
        if (!value) {
          setNameError('名称不能为空');
        } else {
          setNameError('');
        }
      }

      if (field === 'description' && descriptionIndex === 0) {
        if (!value) {
          setDescriptionError('单词/短语释义为必填项');
        } else {
          setDescriptionError('');
        }
      }

      if ((field === 'description' && descriptionIndex === 1) || field === 'example') {
        const example = field === 'example' ? (value as string) : formData.example;
        const descriptionSentence =
          field === 'example' ? formData.description[1] : (value as string);

        if (example && !descriptionSentence) {
          setExampleSentenceError('填写例句时，例句释义为必填项');
        } else {
          setExampleSentenceError('');
        }
      }

      debounceTimerRef.current = null;
    }, 300);
  };

  const handleOpenAddDialog = () => {
    setFormData({
      name: '',
      example: '',
      description: ['', ''],
      count: 1,
    });
    setIsEditing(false);
    setDialogOpen(true);
    setNameError('');
    setExampleSentenceError('');
    setDescriptionError('');
  };

  const handleOpenEditDialog = (item: Item) => {
    setFormData({
      name: item.name,
      example: item.example || '',
      description: [item.description[0] || '', item.description[1] || ''],
      count: item.count,
    });
    setIsEditing(true);
    setSelectedItem(item);
    setDialogOpen(true);
    setNameError('');
    setExampleSentenceError('');
    setDescriptionError('');

    if (!item.description[0]) {
      setDescriptionError('单词/短语释义为必填项');
    }

    if (item.example && !item.description[1]) {
      setExampleSentenceError('填写例句时，例句释义为必填项');
    }
  };

  const handleOpenDeleteDialog = (item: Item) => {
    setSelectedItem(item);
    setConfirmDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      setNameError('名称不能为空');
      return;
    }
    if (!formData.description[0]) {
      setDescriptionError('单词/短语释义为必填项');
      return;
    }
    if (formData.example && !formData.description[1]) {
      setExampleSentenceError('填写例句时，例句释义为必填项');
      return;
    }

    try {
      let result;

      if (isEditing && selectedItem) {
        const updatedItem = {
          ...selectedItem,
          name: formData.name,
          example: formData.example,
          description: formData.description,
          count: formData.count,
        };

        result = await window.api.updateItem(updatedItem);
      } else {
        result = await window.api.addItem({
          name: formData.name,
          example: formData.example,
          description: formData.description,
          count: formData.count,
        });
      }

      if (result.success) {
        showAlert(
          isEditing ? `"${formData.name}" 已成功更新` : `"${formData.name}" 已成功添加`,
          'success'
        );
        setDialogOpen(false);
        loadItems();
      } else {
        showAlert(result.message || '保存失败', 'error');
      }
    } catch (error) {
      console.error('保存数据失败:', error);
      showAlert('保存数据失败', 'error');
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    try {
      const result = await window.api.deleteItem(selectedItem.name);

      if (result.success) {
        showAlert(`"${selectedItem.name}" 已成功删除`, 'success');
        setConfirmDeleteOpen(false);
        loadItems();
      } else {
        showAlert(result.message || '删除失败', 'error');
      }
    } catch (error) {
      console.error('删除数据失败:', error);
      showAlert('删除数据失败', 'error');
    }
  };

  const handleOpenProjectManifest = () => {
    setProjectManifestOpen(true);
  };

  const handleSaveManifest = async (manifest: ProjectManifest) => {
    try {
      const result = await window.api.updateProjectManifest(projectName, manifest);

      if (result.success) {
        showAlert(`项目信息已成功更新`, 'success');
        setProjectManifestOpen(false);
      } else {
        showAlert(result.message || `更新项目信息失败`, 'error');
      }
    } catch (error) {
      console.error('更新项目信息失败:', error);
      showAlert(`更新项目信息时发生错误`, 'error');
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragEnter = (index: number) => {
    if (draggedItem === null) return;
    setDraggedOverItem(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnd = () => {
    if (draggedItem === null || draggedOverItem === null) {
      setDraggedItem(null);
      setDraggedOverItem(null);
      return;
    }

    const itemsCopy = [...filteredItems];
    const draggedItemContent = itemsCopy[draggedItem];

    itemsCopy.splice(draggedItem, 1);
    itemsCopy.splice(draggedOverItem, 0, draggedItemContent);

    const newItems = [...items];

    if (searchQuery) {
      const filteredIds = filteredItems.map(item => item.id);

      const unfilteredItems = newItems.filter(item => !filteredIds.includes(item.id));

      const reorderedItems = [...itemsCopy, ...unfilteredItems];

      setItems(reorderedItems);
    } else {
      setItems(itemsCopy);
    }

    setDraggedItem(null);
    setDraggedOverItem(null);

    (async () => {
      try {
        const result = await window.api.saveItemsOrder(searchQuery ? items : itemsCopy);
        if (result.success) {
          showAlert('排序已更新并保存', 'success');

          loadItems(true);
        } else {
          showAlert(`排序保存失败：${result.message}`, 'error');
          loadItems(true);
        }
      } catch (error) {
        console.error('保存排序失败:', error);
        showAlert('保存排序失败，已恢复原排序', 'error');
        loadItems(true);
      }
    })();

    console.log(
      '排序完成，正在保存新顺序:',
      (searchQuery ? items : itemsCopy).map(item => item.name).join(', ')
    );
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleDragEnd();
  };

  const filteredItems = items.filter(
    item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.example.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description[0].toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description[1].toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenGenerateVideoDialog = () => {
    setVideoOutputPath('');
    setGenerateVideoDialogOpen(true);
  };

  const handleGenerateVideo = async () => {
    try {
      setGeneratingVideo(true);
      setShowProgress(true);
      setProgressMessage('开始生成视频...');
      setGenerateVideoDialogOpen(false);

      showAlert('开始生成视频，请稍候...', 'info');

      const result = await window.api.generateVideo(projectName, videoOutputPath || undefined);

      if (result.success) {
        showAlert(
          `视频生成成功！${result.filePath ? `保存在: ${result.filePath}` : ''}`,
          'success'
        );
        if (result.filePath) {
          window.api.showItemInFolder(result.filePath);
        }
      } else {
        showAlert(`生成视频失败: ${result.message || '未知错误'}`, 'error');
      }
    } catch (error) {
      console.error('生成视频失败:', error);
      showAlert(`生成视频失败: ${error}`, 'error');
    } finally {
      setGeneratingVideo(false);
      setShowProgress(false);
      setProgressMessage('');
    }
  };

  const handleSelectOutputPath = async () => {
    try {
      const result = await window.api.selectFolder();

      if (!result.canceled && result.filePaths.length > 0) {
        const selectedPath = result.filePaths[0];
        const fileName = `${projectName}_${new Date().getTime()}.mp4`;

        const fullPath = `${selectedPath}\\${fileName}`;
        setVideoOutputPath(fullPath);
      }
    } catch (error) {
      console.error('选择输出路径失败:', error);
      showAlert('选择输出路径失败', 'error');
    }
  };

  const handleOpenPreviewDialog = async (item: Item) => {
    try {
      setSelectedItem(item);
      setPreviewDialogOpen(true);
      setPreviewLoading(true);
      setSelectedImageIndex(0);
      setAudioBase64(['', '']);
      setImageBase64([]);

      const audioResult = await window.api.getAudioPath(item.name);
      if (audioResult.success && audioResult.paths) {
        setAudioPaths(audioResult.paths);

        const audioBase64Temp: [string, string] = ['', ''];
        if (audioResult.paths[0]) {
          const wordAudioResult = await window.api.getFileBase64(audioResult.paths[0]);
          if (wordAudioResult.success && wordAudioResult.base64) {
            audioBase64Temp[0] = wordAudioResult.base64;
          }
        }
        if (audioResult.paths[1]) {
          const exampleAudioResult = await window.api.getFileBase64(audioResult.paths[1]);
          if (exampleAudioResult.success && exampleAudioResult.base64) {
            audioBase64Temp[1] = exampleAudioResult.base64;
          }
        }
        setAudioBase64(audioBase64Temp);
      } else {
        console.error('获取音频路径失败:', audioResult.message);
        setAudioPaths(['', '']);
      }

      const imageResult = await window.api.getImagePath(item.name);
      if (imageResult.success && imageResult.paths) {
        setImagePaths(imageResult.paths);
        const imagePromises = imageResult.paths.map(path => window.api.getFileBase64(path));

        const imageResults = await Promise.all(imagePromises);
        const base64Images = imageResults
          .map(result => (result.success && result.base64 ? result.base64 : ''))
          .filter(base64 => base64 !== '');

        setImageBase64(base64Images);

        if (item.image && imageResult.paths.includes(item.image)) {
          const defaultIndex = imageResult.paths.indexOf(item.image);
          setDefaultImageIndex(defaultIndex);
        } else {
          setDefaultImageIndex(0);
        }
      } else {
        console.error('获取图片路径失败:', imageResult.message);
        setImagePaths([]);
        setImageBase64([]);
      }

      setPreviewLoading(false);
    } catch (error) {
      console.error('加载预览资源失败:', error);
      showAlert('加载预览资源失败', 'error');
      setPreviewDialogOpen(false);
    }
  };
  const handlePlayAudio = (base64Audio: string, index: number) => {
    if (!base64Audio) {
      showAlert('没有可播放的音频', 'info');
      return;
    }

    setAudioPlaying(index);

    if (audioRef.current) {
      audioRef.current.src = base64Audio;
      audioRef.current.onended = () => {
        setAudioPlaying(null);
      };
      audioRef.current.onerror = () => {
        showAlert('播放音频失败', 'error');
        setAudioPlaying(null);
      };
      audioRef.current.play().catch(err => {
        console.error('播放音频失败:', err);
        showAlert('播放音频失败', 'error');
        setAudioPlaying(null);
      });
    }
  };

  const handleSelectAudio = async (isExample: boolean) => {
    if (!selectedItem) return;

    try {
      setAudioLoading(true);
      const result = await window.api.selectAudioFile();

      if (!result.canceled && result.filePaths.length > 0) {
        const audioPath = result.filePaths[0];
        const setAudioResult = await window.api.setItemAudio(
          selectedItem.name,
          audioPath,
          isExample
        );

        if (setAudioResult.success) {
          showAlert(`${isExample ? '例句音频' : '单词音频'}已成功更新`, 'success');

          const newAudioPaths: [string, string] = [...audioPaths];
          newAudioPaths[isExample ? 1 : 0] = setAudioResult.path || '';
          setAudioPaths(newAudioPaths);
          if (setAudioResult.path) {
            const audioBase64Result = await window.api.getFileBase64(setAudioResult.path);
            if (audioBase64Result.success && audioBase64Result.base64) {
              const newAudioBase64: [string, string] = [...audioBase64];
              newAudioBase64[isExample ? 1 : 0] = audioBase64Result.base64;
              setAudioBase64(newAudioBase64);
            }
          }
        } else {
          showAlert(setAudioResult.message || '设置音频失败', 'error');
        }
      }
    } catch (error) {
      console.error('设置音频失败:', error);
      showAlert('设置音频失败', 'error');
    } finally {
      setAudioLoading(false);
    }
  };

  const handleSelectImage = async () => {
    if (!selectedItem) return;

    try {
      setImageLoading(true);
      const result = await window.api.selectImageFile();

      if (!result.canceled && result.filePaths.length > 0) {
        const imagePath = result.filePaths[0];
        const setImageResult = await window.api.setItemImage(selectedItem.name, imagePath);

        if (setImageResult.success) {
          showAlert('图片已成功添加', 'success');

          const imageResult = await window.api.getImagePath(selectedItem.name);
          if (imageResult.success && imageResult.paths) {
            setImagePaths(imageResult.paths);

            if (setImageResult.path) {
              const imageBase64Result = await window.api.getFileBase64(setImageResult.path);
              if (imageBase64Result.success && imageBase64Result.base64) {
                setImageBase64([...imageBase64, imageBase64Result.base64]);
              }
            }
            if (setImageResult.isDefault && setImageResult.path) {
              const newIndex = imageResult.paths.indexOf(setImageResult.path);
              if (newIndex !== -1) {
                setDefaultImageIndex(newIndex);
                setSelectedImageIndex(newIndex);
              }
            }
          }
        } else {
          showAlert(setImageResult.message || '添加图片失败', 'error');
        }
      }
    } catch (error) {
      console.error('添加图片失败:', error);
      showAlert('添加图片失败', 'error');
    } finally {
      setImageLoading(false);
    }
  };

  const handleSetDefaultImage = async (imageIndex: number) => {
    if (!selectedItem || imagePaths.length === 0) return;

    try {
      setImageLoading(true);
      const imagePath = imagePaths[imageIndex];

      const result = await window.api.setDefaultImage(selectedItem.name, imagePath);

      if (result.success) {
        showAlert('默认图片已设置', 'success');
        setDefaultImageIndex(imageIndex);

        const updatedItems = items.map(item => {
          if (item.name === selectedItem.name) {
            return { ...item, image: imagePath };
          }
          return item;
        });
        setItems(updatedItems);
      } else {
        showAlert(result.message || '设置默认图片失败', 'error');
      }
    } catch (error) {
      console.error('设置默认图片失败:', error);
      showAlert('设置默认图片失败', 'error');
    } finally {
      setImageLoading(false);
    }
  };

  const renderTableActions = (item: Item) => (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <IconButton onClick={() => handleOpenPreviewDialog(item)} size="small" sx={{ mx: 0.5 }}>
        <PreviewIcon fontSize="small" />
      </IconButton>
      <IconButton onClick={() => handleOpenEditDialog(item)} size="small" sx={{ mx: 0.5 }}>
        <EditIcon fontSize="small" />
      </IconButton>
      <IconButton onClick={() => handleOpenDeleteDialog(item)} size="small" sx={{ mx: 0.5 }}>
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Box>
  );

  const handleGenerateExample = async () => {
    if (!formData.name || !formData.description[0]) {
      showAlert('请先填写单词和释义', 'warning');
      return;
    }

    try {
      setGeneratingExample(true);
      showAlert('正在使用AI生成例句，请稍候...', 'info');

      const result = await window.api.buildExampleByAI(formData.name, formData.description[0]);

      if (result.success && result.data) {
        setFormData(prev => ({
          ...prev,
          example: result.data[0] || '',
          description: [prev.description[0], result.data[1] || ''],
        }));
        showAlert('例句生成成功', 'success');
      } else {
        showAlert(`生成例句失败: ${result.message || '未知错误'}`, 'error');
      }
    } catch (error) {
      console.error('生成例句失败:', error);
      showAlert(`生成例句失败: ${error}`, 'error');
    } finally {
      setGeneratingExample(false);
    }
  };

  const fetchAllData = async () => {
    try {
      setFetchingData(true);
      setShowProgress(true);
      setProgressMessage('正在准备获取数据...');

      showAlert('开始获取数据，请稍候...', 'info');

      const result = await window.api.fetchAllData();

      if (result.success) {
        showAlert('数据获取成功！', 'success');
        loadItems();

        setShowProgress(false);
        setProgressMessage('');
      } else {
        showAlert(`获取数据失败: ${result.message || '未知错误'}`, 'error');

        setShowProgress(false);
        setProgressMessage('');
      }
    } catch (error) {
      console.error('获取数据失败:', error);
      showAlert(`获取数据失败: ${error}`, 'error');

      setShowProgress(false);
      setProgressMessage('');
    } finally {
      setFetchingData(false);
    }
  };

  const handleGetData = () => {
    fetchAllData();
  };

  return (
    <ThemeProvider theme={customTheme}>
      <Box
        sx={{
          height: '100%',
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 2,
            flexWrap: 'wrap',
            width: '100%',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
            <IconButton onClick={onBack} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" component="h1" noWrap sx={{ mr: 2 }}>
              项目数据管理
            </Typography>
            <Chip
              icon={<FolderIcon />}
              label={projectName}
              color="primary"
              sx={{ ml: { xs: 0, sm: 2 }, mt: { xs: 1, sm: 0 } }}
              variant="outlined"
            />
          </Box>

          <Box sx={{ display: 'flex' }}>
            <Tooltip title="获取数据">
              <span>
                <IconButton color="primary" onClick={handleGetData} disabled={fetchingData}>
                  <DownloadIcon />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="清除缓存">
              <span>
                <IconButton
                  color="warning"
                  onClick={handleOpenClearCacheDialog}
                  disabled={clearingCache}
                >
                  <ClearAllIcon />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="生成视频">
              <span>
                <IconButton
                  color="secondary"
                  onClick={handleOpenGenerateVideoDialog}
                  disabled={generatingVideo || items.length === 0}
                >
                  <VideoFileIcon />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="项目设置">
              <IconButton color="primary" onClick={handleOpenProjectManifest} sx={{ ml: 1 }}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        <Paper
          sx={{
            p: { xs: 1, sm: 2 },
            mb: 2,
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                placeholder="搜索数据项..."
                defaultValue={searchQuery}
                onChange={handleSearch}
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <Box
              sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' }, gap: 2 }}
            >
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleOpenAddDialog}
                size="small"
              >
                添加数据项
              </Button>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<SmartToyIcon />}
                onClick={() => setAiImportDialogOpen(true)}
                size="small"
              >
                AI帮导入
              </Button>
            </Box>
          </Box>
        </Paper>

        {(showProgress || generatingVideo) && (
          <Paper sx={{ p: 2, mb: 2, width: '100%', boxSizing: 'border-box' }}>
            <Box sx={{ width: '100%' }}>
              <Typography variant="subtitle1" gutterBottom>
                {progressMessage ||
                  (generatingVideo ? '正在生成视频，这需要一些时间' : '正在处理...')}
              </Typography>
              <LinearProgress color="primary" />
            </Box>
          </Paper>
        )}

        <Paper
          sx={{
            width: '100%',
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          {loading ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
              }}
            >
              <CircularProgress />
            </Box>
          ) : items.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
              }}
            >
              <Typography variant="h6" color="text.secondary">
                还没有数据项
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                点击"添加数据项"按钮开始创建
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleOpenAddDialog}
                sx={{ mt: 2 }}
              >
                添加数据项
              </Button>
            </Box>
          ) : (
            <TableContainer
              sx={{
                height: '100%',
                overflow: 'auto',
                '&::-webkit-scrollbar': {
                  width: '8px',
                  height: '8px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '4px',
                },
              }}
            >
              <Table stickyHeader size="small" sx={{ tableLayout: 'fixed' }}>
                <TableHead>
                  <TableRow>
                    <TableCell
                      padding="checkbox"
                      width="40px"
                      sx={{ width: '40px', maxWidth: '40px' }}
                    ></TableCell>
                    <TableCell sx={{ width: '15%' }}>名称</TableCell>
                    <TableCell sx={{ width: '20%' }}>释义</TableCell>
                    <TableCell sx={{ width: '20%' }}>例句</TableCell>
                    <TableCell sx={{ width: '20%' }}>例句释义</TableCell>
                    <TableCell sx={{ width: '5%' }}>次数</TableCell>
                    <TableCell align="center" sx={{ width: '80px' }}>
                      操作
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredItems.map((item, index) => (
                    <TableRow
                      key={item.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragEnter={() => handleDragEnter(index)}
                      onDragOver={handleDragOver}
                      onDragEnd={handleDragEnd}
                      onDrop={handleDrop}
                      sx={{
                        backgroundColor:
                          draggedItem === index
                            ? 'rgba(63, 81, 181, 0.12)'
                            : draggedOverItem === index
                              ? 'rgba(63, 81, 181, 0.04)'
                              : 'transparent',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        },
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Box
                          sx={{
                            cursor: 'grab',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.04)',
                              borderRadius: '4px',
                            },
                            '&:active': {
                              cursor: 'grabbing',
                            },
                          }}
                        >
                          <DragHandleIcon color="action" fontSize="small" />
                        </Box>
                      </TableCell>
                      <TableCell
                        sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        <Tooltip title={item.name}>
                          <span>{item.name}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell
                        sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        <Tooltip title={item.description[0]}>
                          <span>{item.description[0]}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell
                        sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        <Tooltip title={item.example}>
                          <span>{item.example}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell
                        sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        <Tooltip title={item.description[1]}>
                          <span>{item.description[1]}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{item.count}</TableCell>
                      <TableCell align="center" padding="checkbox">
                        {renderTableActions(item)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">{isEditing ? '编辑数据项' : '添加数据项'}</Typography>
              <IconButton edge="end" onClick={() => setDialogOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                label="名称"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                fullWidth
                error={!!nameError}
                helperText={nameError || '输入单词或短语'}
                variant="outlined"
                required
                disabled={isEditing}
              />

              <TextField
                label="单词/短语释义"
                value={formData.description[0]}
                onChange={e => handleInputChange('description', e.target.value, 0)}
                fullWidth
                error={!!descriptionError}
                helperText={descriptionError || '输入单词或短语的中文释义'}
                variant="outlined"
                required
              />

              <TextField
                label="例句"
                value={formData.example}
                onChange={e => handleInputChange('example', e.target.value)}
                fullWidth
                helperText="输入包含该单词或短语的例句"
                variant="outlined"
                multiline
                rows={2}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="使用AI生成例句">
                        <IconButton
                          onClick={handleGenerateExample}
                          disabled={generatingExample || !formData.name || !formData.description[0]}
                          color="secondary"
                          size="small"
                        >
                          {generatingExample ? <CircularProgress size={20} /> : <AutoFixHighIcon />}
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="例句释义"
                value={formData.description[1]}
                onChange={e => handleInputChange('description', e.target.value, 1)}
                fullWidth
                error={!!exampleSentenceError}
                helperText={exampleSentenceError || '输入例句的中文释义'}
                variant="outlined"
                multiline
                rows={2}
                required={!!formData.example}
              />

              <TextField
                label="重复次数"
                type="number"
                value={formData.count}
                onChange={e => handleInputChange('count', parseInt(e.target.value) || 1)}
                fullWidth
                helperText="在生成视频时该项目重复的次数"
                variant="outlined"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)} color="inherit">
              取消
            </Button>
            <Button
              onClick={handleSave}
              color="primary"
              variant="contained"
              disabled={
                !!nameError || !formData.name || !!exampleSentenceError || !!descriptionError
              }
            >
              保存
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
          <DialogTitle>确认删除</DialogTitle>
          <DialogContent>
            <Typography>您确定要删除 "{selectedItem?.name}" 吗？此操作不可逆。</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDeleteOpen(false)} color="inherit">
              取消
            </Button>
            <Button onClick={handleDelete} color="error" variant="contained">
              删除
            </Button>
          </DialogActions>
        </Dialog>

        <ProjectManifestEditor
          open={projectManifestOpen}
          onClose={() => setProjectManifestOpen(false)}
          projectName={projectName}
          onSave={handleSaveManifest}
        />

        <Dialog open={generateVideoDialogOpen} onClose={() => setGenerateVideoDialogOpen(false)}>
          <DialogTitle>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">生成视频</Typography>
              <IconButton edge="end" onClick={() => setGenerateVideoDialogOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ minWidth: 400, p: 1 }}>
              <Typography paragraph>
                将会根据当前项目数据生成视频。确保项目已设置了正确的标题、副标题和颜色。
              </Typography>

              <Box sx={{ mt: 2, mb: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  输出路径 (可选)：
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    placeholder="默认保存到视频文件夹"
                    value={videoOutputPath}
                    onChange={e => setVideoOutputPath(e.target.value)}
                    sx={{ flexGrow: 1, mr: 1 }}
                  />
                  <Button variant="outlined" onClick={handleSelectOutputPath}>
                    选择路径
                  </Button>
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setGenerateVideoDialogOpen(false)} color="inherit">
              取消
            </Button>
            <Button
              onClick={handleGenerateVideo}
              color="secondary"
              variant="contained"
              startIcon={<VideoFileIcon />}
              disabled={generatingVideo || items.length === 0}
            >
              开始生成
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={clearCacheDialogOpen} onClose={() => setClearCacheDialogOpen(false)}>
          <DialogTitle>清除缓存</DialogTitle>
          <DialogContent>
            <Typography>您确定要清除该项目的缓存吗？这可能会导致某些数据重新加载。</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setClearCacheDialogOpen(false)} color="inherit">
              取消
            </Button>
            <Button
              onClick={handleClearCache}
              color="error"
              variant="contained"
              disabled={clearingCache}
            >
              {clearingCache ? <CircularProgress size={24} /> : '清除缓存'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={alert.open}
          autoHideDuration={6000}
          onClose={() => setAlert({ ...alert, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setAlert({ ...alert, open: false })} severity={alert.severity}>
            {alert.message}
          </Alert>
        </Snackbar>

        <Dialog
          open={previewDialogOpen}
          onClose={() => setPreviewDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">{selectedItem?.name} - 媒体预览</Typography>
              <IconButton edge="end" onClick={() => setPreviewDialogOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            {previewLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <audio ref={audioRef} style={{ display: 'none' }} />
                <Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1,
                    }}
                  >
                    <Typography variant="subtitle1">
                      <AudioFileIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                      音频文件
                    </Typography>
                  </Box>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box
                      sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Typography variant="body2">单词音频:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={
                                audioPlaying === 0 ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <VolumeUpIcon />
                                )
                              }
                              disabled={!audioBase64[0] || audioPlaying !== null}
                              onClick={() => handlePlayAudio(audioBase64[0], 0)}
                              sx={{ mr: 1 }}
                            >
                              播放
                            </Button>
                            <Button
                              variant="outlined"
                              color="secondary"
                              size="small"
                              onClick={() => handleSelectAudio(false)}
                              disabled={audioLoading}
                              sx={{ ml: 1 }}
                            >
                              更换音频
                            </Button>
                          </Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {audioPaths[0] ? audioPaths[0].split('\\').pop() : '无音频文件'}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Typography variant="body2">例句音频:</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={
                                audioPlaying === 1 ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <VolumeUpIcon />
                                )
                              }
                              disabled={!audioBase64[1] || audioPlaying !== null}
                              onClick={() => handlePlayAudio(audioBase64[1], 1)}
                              sx={{ mr: 1 }}
                            >
                              播放
                            </Button>
                            <Button
                              variant="outlined"
                              color="secondary"
                              size="small"
                              onClick={() => handleSelectAudio(true)}
                              disabled={audioLoading}
                              sx={{ ml: 1 }}
                            >
                              更换音频
                            </Button>
                          </Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {audioPaths[1] ? audioPaths[1].split('\\').pop() : '无音频文件'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    {audioLoading && (
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                        <CircularProgress size={24} />
                      </Box>
                    )}
                  </Paper>
                </Box>

                <Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1,
                    }}
                  >
                    <Typography variant="subtitle1">
                      <ImageIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                      图片文件
                    </Typography>
                    <Button
                      variant="outlined"
                      color="secondary"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={handleSelectImage}
                      disabled={imageLoading}
                    >
                      添加图片
                    </Button>
                  </Box>
                  {imageBase64.length === 0 ? (
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography color="text.secondary">没有可用的图片</Typography>
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={handleSelectImage}
                        sx={{ mt: 2 }}
                        disabled={imageLoading}
                      >
                        添加图片
                      </Button>
                    </Paper>
                  ) : (
                    <Box>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          mb: 2,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          height: '300px',
                          overflow: 'hidden',
                        }}
                      >
                        {imageLoading ? (
                          <CircularProgress />
                        ) : (
                          <img
                            src={imageBase64[selectedImageIndex]}
                            alt={`图片 ${selectedImageIndex + 1}`}
                            style={{
                              maxWidth: '100%',
                              maxHeight: '100%',
                              objectFit: 'contain',
                            }}
                          />
                        )}
                      </Paper>

                      <Box
                        sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}
                      >
                        {imageBase64.map((base64, index) => (
                          <Box
                            key={index}
                            sx={{
                              position: 'relative',
                              width: 60,
                              height: 60,
                            }}
                          >
                            <Avatar
                              src={base64}
                              alt={`缩略图 ${index + 1}`}
                              variant="rounded"
                              sx={{
                                width: 60,
                                height: 60,
                                cursor: 'pointer',
                                border:
                                  selectedImageIndex === index
                                    ? '2px solid #1976d2'
                                    : '2px solid transparent',
                                '&:hover': {
                                  opacity: 0.8,
                                },
                              }}
                              onClick={() => setSelectedImageIndex(index)}
                            />
                            {index === defaultImageIndex && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  bottom: 0,
                                  right: 0,
                                  bgcolor: 'primary.main',
                                  color: 'white',
                                  borderRadius: '50%',
                                  width: 16,
                                  height: 16,
                                  display: 'flex',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  boxShadow: 1,
                                }}
                              >
                                ✓
                              </Box>
                            )}
                          </Box>
                        ))}
                      </Box>

                      {selectedImageIndex !== defaultImageIndex && imageBase64.length > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                          <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            onClick={() => handleSetDefaultImage(selectedImageIndex)}
                            disabled={imageLoading}
                          >
                            使用图片
                          </Button>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewDialogOpen(false)} color="primary">
              关闭
            </Button>
          </DialogActions>
        </Dialog>

        <AIImport
          open={aiImportDialogOpen}
          onClose={() => setAiImportDialogOpen(false)}
          onImportSuccess={() => loadItems()}
        />
      </Box>
    </ThemeProvider>
  );
}
