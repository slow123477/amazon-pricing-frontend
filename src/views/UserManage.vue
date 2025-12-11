<template>
  <div class="page">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>用户管理（仅管理员）</span>
          <el-button type="primary" @click="openDialog()">新增用户</el-button>
        </div>
      </template>
      <el-table :data="users" v-loading="loading" height="520px">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="username" label="用户名" min-width="140" />
        <el-table-column prop="role" label="角色" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
              {{ scope.row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column prop="updatedAt" label="更新时间" width="180" />
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-space :size="8">
              <el-button
                size="small"
                :disabled="scope.row.username === username"
                @click="openDialog(scope.row)"
              >
                编辑
              </el-button>
              <el-button
                size="small"
                type="danger"
                :disabled="scope.row.username === username"
                @click="handleDelete(scope.row)"
              >
                删除
              </el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="420px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="!!form.id" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" style="width: 200px">
            <el-option label="管理员" value="ADMIN" />
            <el-option label="普通用户" value="USER" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { authApi } from '@/api/auth'
import { useUserStore } from '@/store/user'

const users = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增用户')
const saving = ref(false)
const formRef = ref(null)
const form = ref({
  id: null,
  username: '',
  password: '',
  role: 'USER',
  status: 1
})
const userStore = useUserStore()
const username = computed(() => userStore.username)

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: false, message: '请输入密码', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

const loadUsers = async () => {
  loading.value = true
  try {
    users.value = await authApi.listUsers()
  } catch (e) {
    ElMessage.error('加载用户失败')
  } finally {
    loading.value = false
  }
}

const openDialog = row => {
  if (row && row.username === username.value) {
    ElMessage.warning('不能编辑当前登录用户')
    return
  }
  if (row) {
    dialogTitle.value = '编辑用户'
    form.value = {
      id: row.id,
      username: row.username,
      password: '',
      role: row.role,
      status: row.status
    }
  } else {
    dialogTitle.value = '新增用户'
    form.value = { id: null, username: '', password: '', role: 'USER', status: 1 }
  }
  dialogVisible.value = true
}

const handleSave = () => {
  formRef.value.validate(async valid => {
    if (!valid) return
    saving.value = true
    try {
      if (form.value.id) {
        const payload = { role: form.value.role, status: form.value.status }
        if (form.value.password) payload.passwordHash = form.value.password
        await authApi.updateUser(form.value.id, payload)
        ElMessage.success('更新成功')
      } else {
        await authApi.createUser({
          username: form.value.username,
          passwordHash: form.value.password,
          role: form.value.role,
          status: form.value.status
        })
        ElMessage.success('创建成功')
      }
      dialogVisible.value = false
      loadUsers()
    } catch (e) {
      ElMessage.error(e.message || '保存失败')
    } finally {
      saving.value = false
    }
  })
}

const handleDelete = row => {
  if (row.username === username.value) {
    ElMessage.warning('不能删除当前登录用户')
    return
  }
  ElMessageBox.confirm(`确认删除用户「${row.username}」?`, '提示', { type: 'warning' })
    .then(async () => {
      await authApi.deleteUser(row.id)
      ElMessage.success('删除成功')
      loadUsers()
    })
    .catch(() => {})
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>


