<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
    <img src="/blinkpe-logo.png" alt="BlinkPe" class="h-12 w-auto mb-8" />
    <Card title="Login to BlinkPe" class="w-full max-w-md">
      <form class="flex flex-col space-y-2 w-full" @submit.prevent="submit">
        <Input
          required
          name="email"
          type="text"
          placeholder="johndoe@email.com"
          label="User ID"
        />
        <Input
          required
          name="password"
          type="password"
          placeholder="••••••"
          label="Password"
        />
        <Button :loading="session.login.loading" variant="solid"
          >Login</Button
        >
      </form>
    </Card>
  </div>
</template>

<script lang="ts" setup>
import { session } from "../data/session"

function submit(e) {
	const formData = new FormData(e.target)
	session.login.submit({
		email: formData.get("email"),
		password: formData.get("password"),
	})
}
</script>
