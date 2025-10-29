import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, ExclamationTriangleIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import { styled } from '@mui/material/styles';
import { Box, Typography, IconButton, Collapse, Alert as MuiAlert } from '@mui/material';

const StyledAlert = styled(MuiAlert)(({ theme, severity }) => ({
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1],
  '& .MuiAlert-message': {
    width: '100%',
  },
}));

const Alert = ({
  open = true,
  onClose,
  severity = 'info',
  title,
  message,
  autoHideDuration = 6000,
  ...props
}) => {
  const [isOpen, setIsOpen] = React.useState(open);

  React.useEffect(() => {
    setIsOpen(open);
  }, [open]);

  React.useEffect(() => {
    if (autoHideDuration && isOpen && onClose) {
      const timer = setTimeout(() => {
        setIsOpen(false);
        onClose();
      }, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoHideDuration, onClose]);

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  const getIcon = () => {
    const iconMap = {
      success: {
        icon: CheckCircleIcon,
        color: 'text-green-500',
      },
      warning: {
        icon: ExclamationTriangleIcon,
        color: 'text-yellow-600',
      },
      error: {
        icon: ExclamationCircleIcon,
        color: 'text-red-500',
      },
      info: {
        icon: InformationCircleIcon,
        color: 'text-blue-500',
      },
    };

    const { icon: Icon, color } = iconMap[severity] || iconMap.info;
    
    return <Icon className={`h-5 w-5 ${color}`} />;
  };

  if (!isOpen) return null;

  return (
    <Collapse in={isOpen}>
      <Box sx={{ mb: 2, boxShadow: 3, maxWidth: '380px', width: 'auto' }}>
        <Box 
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            p: 2,
            borderRadius: 1,
            bgcolor: 'background.paper',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: '4px',
              bgcolor: severity === 'success' ? 'success.main' : 
                       severity === 'error' ? 'error.main' :
                       severity === 'warning' ? 'warning.main' : 'info.main'
            }
          }}
        >
          {/* Icono */}
          <Box sx={{ 
            mr: 2,
            mt: '2px',
            flexShrink: 0
          }}>
            {getIcon()}
          </Box>
          
          {/* Contenido */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {title && (
                <Typography 
                  fontWeight="bold" 
                  component="div"
                  sx={{ 
                    lineHeight: 1.4, 
                    mb: 0.5,
                    pr: 4
                  }}
                >
                  {title}
                </Typography>
              )}
              <Typography 
                variant="body2" 
                component="div" 
                sx={{ 
                  wordBreak: 'break-word',
                  lineHeight: 1.4,
                  color: 'text.primary',
                  opacity: 0.9,
                  pr: 1
                }}
              >
                {message}
              </Typography>
            </Box>
            
            {/* Botón de cerrar */}
            <IconButton
              aria-label="Cerrar"
              size="small"
              onClick={handleClose}
              sx={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                color: 'text.secondary',
                opacity: 0.7,
                '&:hover': {
                  opacity: 1,
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <XMarkIcon className="h-5 w-5" />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Collapse>
  );
};

export default Alert;
