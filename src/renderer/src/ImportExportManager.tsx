import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  IconButton,
  CircularProgress,
  Alert,
  Paper,
  LinearProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import DescriptionIcon from '@mui/icons-material/Description';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface ImportExportManagerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onImportSuccess?: () => void;
}

export default function ImportExportManager({
  open,
  onClose,
  onSuccess,
  onImportSuccess,
}: ImportExportManagerProps) {
  const [view, setView] = useState<'main' | 'import-options' | 'ai-import'>('main');
  const [aiInputText, setAiInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isDragOver, setIsDragOver] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const handleClose = () => {
    if (!loading) {
      setAiInputText('');
      setError('');
      setSuccess('');
      setView('main');
      onClose();
    }
  };

  const handleBack = () => {
    setView('main');
    setError('');
    setSuccess('');
  };

  const handleImportOptionsBack = () => {
    setView('import-options');
    setError('');
    setSuccess('');
  };

  const handleShowImportOptions = () => {
    setView('import-options');
  };

  const handleAiImport = async () => {
    if (!aiInputText.trim()) {
      setError('请输入要导入的数据');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const result = await window.api.importDataByAI(aiInputText);

      if (result.success) {
        setSuccess('数据导入成功！');
        setAiInputText('');

        setTimeout(() => {
          onSuccess();

          if (onImportSuccess) {
            onImportSuccess();
          }
          handleClose();
        }, 1500);
      } else {
        setError(`导入失败: ${result.message}`);
      }
    } catch (error) {
      console.error('AI导入数据失败:', error);
      setError(`导入失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileImport = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const result = await window.api.importDatabaseFile();

      if (result.success) {
        setSuccess('数据文件导入成功！');
        setTimeout(() => {
          onSuccess();

          if (onImportSuccess) {
            onImportSuccess();
          }
          handleClose();
        }, 1500);
      } else {
        setError(`导入失败: ${result.message || '文件格式错误或不兼容'}`);
      }
    } catch (error) {
      console.error('数据文件导入失败:', error);
      setError(`导入失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAiImport = () => {
    setView('ai-import');
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const result = await window.api.exportDatabaseFile();

      if (result.success) {
        setSuccess('数据导出成功！');
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 1500);
      } else {
        setError(`导出失败: ${result.message}`);
      }
    } catch (error) {
      console.error('导出数据失败:', error);
      setError(`导出失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleFileDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);

    const files = event.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension !== 'pnd' && fileExtension !== 'json') {
      setError('不支持的文件格式，请选择.pnd或.json文件');
      return;
    }

    try {
      setIsImporting(true);
      setImportProgress(0);
      setError('');
      setSuccess('');

      const reader = new FileReader();

      reader.onload = async e => {
        try {
          const fileContent = e.target?.result as string;
          if (!fileContent) {
            throw new Error('无法读取文件内容');
          }

          const data = JSON.parse(fileContent);

          const items = Array.isArray(data) ? data : null;

          if (!items) {
            throw new Error('文件格式无效，未找到有效的数据项数组');
          }

          setTotalCount(items.length);
          setImportedCount(0);

          let successCount = 0;
          for (let i = 0; i < items.length; i++) {
            const item = items[i];

            if (!item.name) {
              console.warn('跳过无效数据项:', item);
              continue;
            }

            const description: [string, string] = Array.isArray(item.description)
              ? [item.description[0] || '', item.description[1] || '']
              : ['', ''];

            const result = await window.api.addItem({
              name: item.name,
              example: item.example || '',
              description: description,
              count: item.count || 1,
            });

            if (result.success) {
              successCount++;
            }

            setImportedCount(i + 1);
            setImportProgress(Math.round(((i + 1) / items.length) * 100));
          }

          setSuccess(`数据导入成功！成功导入 ${successCount} 项，共 ${items.length} 项`);

          setTimeout(() => {
            onSuccess();

            if (onImportSuccess) {
              onImportSuccess();
            }
            handleClose();
          }, 2000);
        } catch (error) {
          console.error('解析导入文件失败:', error);
          setError(`导入失败: ${error instanceof Error ? error.message : '文件格式错误'}`);
        } finally {
          setIsImporting(false);
          setImportProgress(0);
        }
      };

      reader.onerror = () => {
        setError('读取文件失败');
        setIsImporting(false);
      };

      reader.readAsText(file);
    } catch (error) {
      console.error('文件导入失败:', error);
      setError(`导入失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setIsImporting(false);
    }
  };

  const renderMainView = () => (
    <>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <ImportExportIcon sx={{ mr: 1 }} />
            <Typography variant="h6">导入与导出</Typography>
          </Box>
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleClose}
            disabled={loading}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            width: '100%',
            height: '300px',
            gap: 3,
          }}
        >
          <Paper
            elevation={3}
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              borderRadius: 2,
              '&:hover': {
                transform: 'scale(1.03)',
                boxShadow: 6,
              },
            }}
            onClick={handleShowImportOptions}
          >
            <FileUploadIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" align="center" gutterBottom>
              导入数据
            </Typography>
            <Typography variant="body2" align="center" color="text.secondary">
              从文件导入数据或使用AI辅助导入
            </Typography>
          </Paper>

          <Paper
            elevation={3}
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              borderRadius: 2,
              '&:hover': {
                transform: 'scale(1.03)',
                boxShadow: 6,
              },
            }}
            onClick={handleExport}
          >
            <FileDownloadIcon sx={{ fontSize: 80, color: 'secondary.main', mb: 2 }} />
            <Typography variant="h5" align="center" gutterBottom>
              导出数据
            </Typography>
            <Typography variant="body2" align="center" color="text.secondary">
              将当前项目数据导出为文件
            </Typography>
          </Paper>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          关闭
        </Button>
      </DialogActions>
    </>
  );

  const renderImportOptionsView = () => (
    <>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleBack}
              disabled={loading}
              aria-label="back"
              sx={{ mr: 1 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6">选择导入方式</Typography>
          </Box>
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleClose}
            disabled={loading}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            width: '100%',
            height: '300px',
            gap: 3,
          }}
        >
          <Paper
            elevation={3}
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              borderRadius: 2,
              position: 'relative',
              border: isDragOver ? '2px dashed #1976d2' : '2px dashed transparent',
              '&:hover': {
                transform: 'scale(1.03)',
                boxShadow: 6,
              },
            }}
            onClick={handleFileImport}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleFileDrop}
          >
            {isImporting ? (
              <Box sx={{ width: '100%', p: 3 }}>
                <Typography variant="h6" align="center" gutterBottom>
                  正在导入...({importedCount}/{totalCount})
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={importProgress}
                  sx={{ my: 2, height: 10, borderRadius: 1 }}
                />
                <Typography variant="body2" align="center" color="text.secondary">
                  请稍候，正在处理文件数据
                </Typography>
              </Box>
            ) : (
              <>
                <DescriptionIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" align="center" gutterBottom>
                  从.pnd文件导入
                </Typography>
                <Typography variant="body2" align="center" color="text.secondary">
                  导入标准格式的项目数据文件
                </Typography>
                <Typography variant="caption" align="center" sx={{ mt: 2, fontStyle: 'italic' }}>
                  拖拽文件到此处直接导入
                </Typography>
              </>
            )}
          </Paper>

          <Paper
            elevation={3}
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              borderRadius: 2,
              '&:hover': {
                transform: 'scale(1.03)',
                boxShadow: 6,
              },
            }}
            onClick={handleOpenAiImport}
          >
            <SmartToyIcon sx={{ fontSize: 80, color: 'secondary.main', mb: 2 }} />
            <Typography variant="h5" align="center" gutterBottom>
              AI导入
            </Typography>
            <Typography variant="body2" align="center" color="text.secondary">
              使用AI从文本中提取数据
            </Typography>
          </Paper>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          关闭
        </Button>
      </DialogActions>
    </>
  );

  const renderAiImportView = () => (
    <>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleImportOptionsBack}
              disabled={loading}
              aria-label="back"
              sx={{ mr: 1 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <SmartToyIcon sx={{ mr: 1 }} />
            <Typography variant="h6">AI辅助导入</Typography>
          </Box>
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleClose}
            disabled={loading}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" gutterBottom>
            通过AI辅助导入数据，可以从文本快速创建结构化的数据项。
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            请输入包含单词、短语或句子的文本，AI将帮助您提取并格式化数据。
          </Typography>
        </Box>

        <TextField
          autoFocus
          multiline
          rows={10}
          variant="outlined"
          fullWidth
          placeholder="在此粘贴需要导入的文本..."
          value={aiInputText}
          onChange={e => setAiInputText(e.target.value)}
          disabled={loading}
        />

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Button onClick={handleImportOptionsBack} color="inherit" disabled={loading}>
          返回
        </Button>
        <Button
          onClick={handleAiImport}
          variant="contained"
          color="primary"
          startIcon={loading ? <CircularProgress size={20} /> : <SmartToyIcon />}
          disabled={loading || !aiInputText.trim()}
        >
          {loading ? '处理中...' : 'AI导入数据'}
        </Button>
      </DialogActions>
    </>
  );

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      {view === 'main' && renderMainView()}
      {view === 'import-options' && renderImportOptionsView()}
      {view === 'ai-import' && renderAiImportView()}
    </Dialog>
  );
}
