<template>
  <router-view v-if="isLoginPage" />
  <Layout v-else />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Layout from './components/Layout.vue'

const route = useRoute()
const isLoginPage = computed(() => route.path === '/login')
</script>
