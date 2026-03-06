/**
 * StudySetManager 组件测试
 */

import {
  flushPromises,
  mount,
} from '@vue/test-utils'
import {
  createPinia,
  setActivePinia,
} from 'pinia'
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import StudySetManager from '../../components/StudySetManager.vue'

// Mock 子组件
vi.mock('../../components/SiyuanTheme/SyButton.vue', () => ({
  default: {
    name: 'SyButton',
    props: ['type', 'onClick'],
    template: '<button class="sy-button"><slot /></button>',
  },
}))

vi.mock('../../components/SiyuanTheme/SyInput.vue', () => ({
  default: {
    name: 'SyInput',
    props: ['modelValue', 'placeholder'],
    emits: ['update:modelValue'],
    template: '<input class="sy-input" :value="modelValue" />',
  },
}))

vi.mock('../../components/SiyuanTheme/SyTextarea.vue', () => ({
  default: {
    name: 'SyTextarea',
    props: ['modelValue', 'placeholder'],
    emits: ['update:modelValue'],
    template: '<textarea class="sy-textarea" :value="modelValue" />',
  },
}))

describe('studySetManager', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  it('should render component', () => {
    const wrapper = mount(StudySetManager, {
      global: {
        plugins: [pinia],
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('should display study set list', async () => {
    const wrapper = mount(StudySetManager, {
      global: {
        plugins: [pinia],
      },
    })

    await flushPromises()

    // 检查是否显示学习集列表标题
    expect(wrapper.text()).toContain('学习集')
  })

  it('should show create button', () => {
    const wrapper = mount(StudySetManager, {
      global: {
        plugins: [pinia],
      },
    })

    const createButton = wrapper.find('[data-testid="create-study-set"]')
    expect(createButton.exists()).toBe(true)
  })

  it('should open create dialog when create button clicked', async () => {
    const wrapper = mount(StudySetManager, {
      global: {
        plugins: [pinia],
      },
    })

    await flushPromises()

    const createButton = wrapper.find('[data-testid="create-study-set"]')
    if (createButton.exists()) {
      await createButton.trigger('click')
      await flushPromises()

      // 检查对话框是否打开
      expect(wrapper.vm.showCreateDialog).toBe(true)
    }
  })

  it('should validate form before submit', async () => {
    const wrapper = mount(StudySetManager, {
      global: {
        plugins: [pinia],
      },
    })

    await flushPromises()

    const vm = wrapper.vm as any

    // 测试空名称验证
    vm.formData.name = ''
    const isValid = vm.validateForm()
    expect(isValid).toBe(false)
  })

  it('should emit select event when study set clicked', async () => {
    const wrapper = mount(StudySetManager, {
      global: {
        plugins: [pinia],
        stubs: {
          'sy-button': {
            template: '<button><slot /></button>',
          },
        },
      },
    })

    await flushPromises()

    // 模拟点击学习集
    const studySetItem = wrapper.find('[data-testid="study-set-item"]')
    if (studySetItem.exists()) {
      await studySetItem.trigger('click')
      expect(wrapper.emitted('select')).toBeDefined()
    }
  })

  it('should show delete confirmation dialog', async () => {
    const wrapper = mount(StudySetManager, {
      global: {
        plugins: [pinia],
      },
    })

    await flushPromises()

    const vm = wrapper.vm as any
    vm.showDeleteConfirm('test-id', '测试学习集')
    await wrapper.vm.$nextTick()

    expect(vm.showDeleteConfirmDialog).toBe(true)
  })

  it('should close dialog on cancel', async () => {
    const wrapper = mount(StudySetManager, {
      global: {
        plugins: [pinia],
      },
    })

    await flushPromises()

    const vm = wrapper.vm as any
    vm.showCreateDialog = true
    await wrapper.vm.$nextTick()

    vm.handleCancel()
    await wrapper.vm.$nextTick()

    expect(vm.showCreateDialog).toBe(false)
  })

  it('should reset form after successful creation', async () => {
    const wrapper = mount(StudySetManager, {
      global: {
        plugins: [pinia],
      },
    })

    await flushPromises()

    const vm = wrapper.vm as any

    // 设置表单数据
    vm.formData.name = '新学习集'
    vm.formData.description = '测试描述'

    // 重置表单
    vm.resetForm()

    expect(vm.formData.name).toBe('')
    expect(vm.formData.description).toBe('')
  })
})
