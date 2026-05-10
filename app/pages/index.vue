<script setup>
definePageMeta({ layout: false })

const { isLoggedIn } = useAuthClient()

onMounted(() => {
  window.location.href = isLoggedIn.value ? "/dashboard" : "/login"
})
</script>

<template>
  <div></div>
</template>
