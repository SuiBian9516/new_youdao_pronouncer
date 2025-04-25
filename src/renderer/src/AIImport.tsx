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
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SmartToyIcon from '@mui/icons-material/SmartToy';

interface AIImportProps {
  open: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export default function AIImport({ open, onClose, onImportSuccess }: AIImportProps) {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleImport = async () => {
    if (!inputText.trim()) {
      setError('请输入要导入的数据');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const result = await window.api.importDataByAI(inputText);

      if (result.success) {
        setSuccess('数据导入成功！');
        setInputText('');
        setTimeout(() => {
          onImportSuccess();
          onClose();
          setSuccess('');
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

  const handleClose = () => {
    if (!loading) {
      setInputText('');
      setError('');
      setSuccess('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
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
          <Typography variant="body2" color="text.secondary" gutterBottom>
            请输入包含单词、短语或句子的文本，AI将帮助您提取并格式化数据。
          </Typography>
          <Typography variant="body2" color="text.secondary">
            例如: 输入一段包含多个单词和释义的文本，AI将自动识别并导入。
          </Typography>
        </Box>

        <TextField
          autoFocus
          multiline
          rows={12}
          variant="outlined"
          fullWidth
          placeholder="在此粘贴需要导入的文本..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
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
        <Button
          onClick={handleClose}
          color="inherit"
          disabled={loading}
        >
          取消
        </Button>
        <Button
          onClick={handleImport}
          variant="contained"
          color="primary"
          startIcon={loading ? <CircularProgress size={20} /> : <SmartToyIcon />}
          disabled={loading || !inputText.trim()}
        >
          {loading ? '处理中...' : 'AI导入数据'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}