import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Typography,
  Box,
  Button,
  CircularProgress,
  ThemeProvider,
  Tooltip,
  Divider,
  Snackbar,
  Alert,
} from '@mui/material';
import { customTheme } from './App';
import CloseIcon from '@mui/icons-material/Close';
import FolderIcon from '@mui/icons-material/Folder';
import DeleteIcon from '@mui/icons-material/Delete';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RefreshIcon from '@mui/icons-material/Refresh';

interface ProjectInfo {
  name: string;
  path: string;
  lastModifiedTime: string;
}

interface ProjectListDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectProject: (projectName: string) => void;
}

export default function ProjectListDialog({
  open,
  onClose,
  onSelectProject,
}: ProjectListDialogProps) {
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const loadProjects = async () => {
    try {
      setLoading(true);
      const projectList = await window.api.getProjects();
      setProjects(projectList);
    } catch (error) {
      console.error('获取项目列表失败:', error);
      setAlert({
        open: true,
        message: '获取项目列表失败',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadProjects();
    }
  }, [open]);

  const handleOpenProject = (projectName: string) => {
    onSelectProject(projectName);
    onClose();
  };

  const handleDeleteProject = async (projectName: string) => {
    try {
      const result = await window.api.deleteProject(projectName);

      if (result.success) {
        setAlert({
          open: true,
          message: `项目 "${projectName}" 已成功删除`,
          severity: 'success',
        });
        loadProjects();
      } else {
        setAlert({
          open: true,
          message: result.message || `删除项目失败`,
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('删除项目失败:', error);
      setAlert({
        open: true,
        message: `删除项目时发生错误`,
        severity: 'error',
      });
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleRefresh = () => {
    loadProjects();
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  return (
    <ThemeProvider theme={customTheme}>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            minHeight: '50vh',
          },
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h5">项目列表</Typography>
            <IconButton edge="end" onClick={onClose} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="300px">
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Box mb={2} display="flex" justifyContent="flex-end">
                <Tooltip title="刷新项目列表">
                  <IconButton onClick={handleRefresh}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              {projects.length === 0 ? (
                <Box
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="center"
                  height="300px"
                >
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    没有找到任何项目
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                    sx={{ maxWidth: 400 }}
                  >
                    您可以创建一个新项目
                  </Typography>
                </Box>
              ) : (
                <List>
                  {projects.map((project, index) => (
                    <Box key={project.name}>
                      {index > 0 && <Divider variant="inset" component="li" />}
                      <ListItem
                        component="button"
                        onClick={() => handleOpenProject(project.name)}
                        secondaryAction={
                          <Box>
                            <Tooltip title="删除项目">
                              <IconButton
                                edge="end"
                                onClick={e => {
                                  e.stopPropagation();
                                  setConfirmDelete(project.name);
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        }
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: customTheme.palette.primary.main }}>
                            <FolderIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" fontWeight="medium">
                              {project.name}
                            </Typography>
                          }
                          secondary={
                            <>
                              <Typography
                                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                                component="span"
                                variant="body2"
                                color="text.primary"
                              >
                                <span style={{ fontSize: '0.8rem', color: 'gray' }}>
                                  {project.path}
                                </span>
                              </Typography>
                              <Typography
                                sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}
                                component="span"
                                variant="body2"
                                color="text.secondary"
                              >
                                <AccessTimeIcon fontSize="small" />
                                <span>上次修改: {project.lastModifiedTime}</span>
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                    </Box>
                  ))}
                </List>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">确认删除项目</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            您确定要删除项目 "{confirmDelete}" 吗？此操作不可逆，项目数据将被永久删除。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)} color="primary">
            取消
          </Button>
          <Button
            onClick={() => confirmDelete && handleDeleteProject(confirmDelete)}
            color="error"
            variant="contained"
            autoFocus
          >
            确认删除
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseAlert} severity={alert.severity}>
          {alert.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
