import React, { useState } from 'react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui';

interface BulkOperationsToolbarProps {
  selectedCount: number;
  onBulkStatusChange: (status: string) => void;
  onBulkRoleAssign: (roleId: string) => void;
  onClearSelection: () => void;
  roles: { _id: string; name: string }[];
}

const BulkOperationsToolbar: React.FC<BulkOperationsToolbarProps> = ({
  selectedCount,
  onBulkStatusChange,
  onBulkRoleAssign,
  onClearSelection,
  roles,
}) => {
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  const handleStatusApply = () => {
    onBulkStatusChange(selectedStatus);
    setShowStatusDialog(false);
    setSelectedStatus('');
  };

  const handleRoleApply = () => {
    onBulkRoleAssign(selectedRole);
    setShowRoleDialog(false);
    setSelectedRole('');
  };

  return (
    <div className="bg-muted p-3 rounded-md flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="font-medium">
          {selectedCount} user{selectedCount !== 1 ? 's' : ''} selected
        </span>
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          Clear
        </Button>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Bulk Actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Manage Selected Users</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setShowStatusDialog(true)}>
              <span>Update Status</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowRoleDialog(true)}>
              <span>Assign Role</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Status Change Dialog */}
      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update User Status</AlertDialogTitle>
            <AlertDialogDescription>
              This action will update the status for {selectedCount} selected
              user{selectedCount !== 1 ? 's' : ''}.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusApply}
              disabled={!selectedStatus}
            >
              Update Status
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Role Assignment Dialog */}
      <AlertDialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Assign Role</AlertDialogTitle>
            <AlertDialogDescription>
              This action will assign a new role to {selectedCount} selected
              user{selectedCount !== 1 ? 's' : ''}.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role._id} value={role._id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRoleApply}
              disabled={!selectedRole}
            >
              Assign Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BulkOperationsToolbar;
