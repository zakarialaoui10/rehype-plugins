import { MindMap } from '@zikojs/mind-elixir/no-css'

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-mind-elixir]').forEach((element) => {
        const body = element.dataset.xmindBody
        const config = element.dataset?.xmindConfig

        if (!body) return

        const nodeData = JSON.parse(body)
        const nodeConfig = JSON.parse(config)

        const map = MindMap({height : '400px', ...nodeConfig}, nodeData)

        map.mount(element)
    })
})
